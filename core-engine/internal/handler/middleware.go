package handler

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow CORS Preflight (OPTIONS) without Auth
		if r.Method == http.MethodOptions {
			next(w, r)
			return
		}

		// 1. Get Token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization Header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 2. Parse & Verify
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte("mock-jwt-secret-key"), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid Token", http.StatusUnauthorized)
			return
		}

		// 3. Extract Claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			tenantID, ok := claims["tenant_id"].(string)
			if !ok {
				http.Error(w, "Invalid Token Claims", http.StatusUnauthorized)
				return
			}

			// Inject TenantID into Context
			ctx := context.WithValue(r.Context(), "tenant_id", tenantID)
			next(w, r.WithContext(ctx))
		} else {
			http.Error(w, "Invalid Token Claims", http.StatusUnauthorized)
		}
	}
}
