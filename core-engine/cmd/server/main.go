package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/aoricaan/idv-core/internal/handler"
	"github.com/aoricaan/idv-core/internal/infra"
	"github.com/aoricaan/idv-core/internal/service"
)

func main() {
	fmt.Println("Starting Core Engine on :8080")

	// 1. Infra
	db, err := infra.InitDB()
	if err != nil {
		log.Fatalf("DB Init failed: %v", err)
	}
	// rdb, _ := infra.InitRedis() // Using DB for MVP session first

	repo := infra.NewRepository(db)

	blobStorage, err := infra.NewBlobStorage()
	if err != nil {
		log.Fatalf("MinIO Init failed: %v", err)
	}
	// Ensure bucket exists
	if err := blobStorage.EnsureBucket(context.Background()); err != nil {
		log.Printf("WARNING: Failed to ensure bucket: %v", err)
	}

	storageService := service.NewStorageService(blobStorage)

	sessionHandler := &handler.SessionHandler{Repo: repo, Storage: storageService}
	adminHandler := &handler.AdminHandler{Repo: repo}

	// 2. Routes
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Admin Routes
	http.HandleFunc("/admin/auth/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == http.MethodPost {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			adminHandler.Login(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	http.HandleFunc("/admin/api-key/rotate", handler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == http.MethodPost {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			adminHandler.RotateAPIKey(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/admin/credits", handler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == http.MethodGet {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			adminHandler.GetCredits(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/admin/credits/add", handler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == http.MethodPost {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			adminHandler.AddCredits(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/admin/credits/simulate", handler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == http.MethodPost {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			adminHandler.SimulateUsage(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/admin/api-key/status", handler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == http.MethodGet {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			adminHandler.GetAPIKeyStatus(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/v1/sessions", func(w http.ResponseWriter, r *http.Request) {
		// CORS Preflight
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodPost {
			sessionHandler.InitSession(w, r)
			return
		}
		if r.Method == http.MethodGet {
			sessionHandler.GetSession(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	http.HandleFunc("/api/v1/sessions/submit", func(w http.ResponseWriter, r *http.Request) {
		// CORS Preflight
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodPost {
			sessionHandler.SubmitStep(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	http.HandleFunc("/api/v1/sessions/upload-url", func(w http.ResponseWriter, r *http.Request) {
		// CORS Preflight
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodPost {
			sessionHandler.GenerateUploadURL(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// 3. Start
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
