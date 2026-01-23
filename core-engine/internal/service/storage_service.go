package service

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/aoricaan/idv-core/internal/infra"
)

type StorageService struct {
	Blob *infra.BlobStorage
}

func NewStorageService(blob *infra.BlobStorage) *StorageService {
	return &StorageService{Blob: blob}
}

func (s *StorageService) GeneratePresignedUploadURL(ctx context.Context, tenantID, sessionToken, filename string) (string, string, error) {
	// Object Key Structure: tenant_id/session_token/filename
	objectKey := fmt.Sprintf("%s/%s/%s", tenantID, sessionToken, filename)

	// Set expiry for the presigned URL
	expiry := time.Duration(15) * time.Minute

	// Generate presigned URL using the SIGNER client (initialized with localhost)
	// This ensures the Host header in the signature matches what the browser sends.
	presignedURL, err := s.Blob.SignerClient.PresignedPutObject(ctx, s.Blob.Bucket, objectKey, expiry)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate presigned url: %w", err)
	}

	return presignedURL.String(), objectKey, nil
}

func (s *StorageService) GeneratePresignedGetURL(ctx context.Context, objectKey string) (string, error) {
	expiry := time.Duration(1) * time.Hour
	reqParams := make(url.Values)

	presignedURL, err := s.Blob.Client.PresignedGetObject(ctx, s.Blob.Bucket, objectKey, expiry, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned get url: %w", err)
	}
	return presignedURL.String(), nil
}
