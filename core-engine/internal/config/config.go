package config

import (
	"log"
	"os"
)

func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("WARNING: JWT_SECRET is not set, using unsafe default for development!")
		return []byte("mock-jwt-secret-key")
	}
	return []byte(secret)
}

func GetMinIOConfig() (string, string, string, string) {
	internalEndpoint := os.Getenv("MINIO_ENDPOINT") // Internal (docker network): "minio:9000"
	if internalEndpoint == "" {
		internalEndpoint = "minio:9000"
	}

	publicEndpoint := os.Getenv("MINIO_PUBLIC_ENDPOINT") // External (browser): "localhost:9000"
	if publicEndpoint == "" {
		publicEndpoint = "localhost:9000" // Default for local dev
	}

	accessKey := os.Getenv("MINIO_ROOT_USER")
	if accessKey == "" {
		accessKey = "minioadmin"
	}
	secretKey := os.Getenv("MINIO_ROOT_PASSWORD")
	if secretKey == "" {
		secretKey = "minioadmin"
	}
	return internalEndpoint, publicEndpoint, accessKey, secretKey
}
