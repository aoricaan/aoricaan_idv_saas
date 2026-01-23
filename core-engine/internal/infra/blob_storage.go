package infra

import (
	"context"
	"fmt"
	"log"

	"github.com/aoricaan/idv-core/internal/config"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type BlobStorage struct {
	Client         *minio.Client
	SignerClient   *minio.Client
	PublicEndpoint string // For presigned URLs
	Bucket         string
}

func NewBlobStorage() (*BlobStorage, error) {
	internalEndpoint, publicEndpoint, accessKey, secretKey := config.GetMinIOConfig()
	useSSL := false

	// Initialize MinIO client (Internal connection for backend ops)
	minioClient, err := minio.New(internalEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: "us-east-1", // Force region to avoid lookup
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize minio client: %w", err)
	}

	// Initialize Signer Client (Public endpoint for presigning only)
	// This ensures the signature matches the 'localhost' host header sent by browser
	signerClient, err := minio.New(publicEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: "us-east-1", // Force region to avoid network call involved in auto-lookup
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize signer client: %w", err)
	}

	return &BlobStorage{
		Client:         minioClient,
		SignerClient:   signerClient,
		PublicEndpoint: publicEndpoint,
		Bucket:         "idv-documents",
	}, nil
}

func (s *BlobStorage) EnsureBucket(ctx context.Context) error {
	exists, err := s.Client.BucketExists(ctx, s.Bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exists {
		err = s.Client.MakeBucket(ctx, s.Bucket, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Printf("Bucket %s created successfully", s.Bucket)
	}

	// Set CORS Policy
	// FIXME: Fix dependencies for BucketCors or do it manually
	/*
		err = s.Client.SetBucketCors(ctx, s.Bucket, credentials.BucketCors{
			LambdaFunctionConfigurations: []credentials.LambdaFunctionConfiguration{},
			CORSRules: []credentials.CORSRule{
				{
					AllowedHeaders: []string{"*"},
					AllowedMethods: []string{"GET", "PUT", "POST", "HEAD"},
					AllowedOrigins: []string{"*"},
					ExposeHeaders:  []string{"ETag"},
				},
			},
		})
		if err != nil {
			log.Printf("WARNING: Failed to set bucket CORS: %v", err)
		}
	*/

	return nil
}
