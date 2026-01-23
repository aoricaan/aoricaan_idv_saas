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
