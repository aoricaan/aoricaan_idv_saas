package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/aoricaan/idv-core/internal/infra"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	Repo *infra.Repository
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.Repo.GetTenantUserByEmail(req.Email)
	if err != nil {
		// Avoid leaking user existence
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Verify Password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":       user.ID,
		"tenant_id": user.TenantID,
		"role":      user.Role,
		"exp":       time.Now().Add(24 * time.Hour).Unix(),
	})

	// TODO: Move secret to env var
	tokenString, err := token.SignedString([]byte("mock-jwt-secret-key"))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{Token: tokenString})
}

type RotateKeyResponse struct {
	NewAPIKey string `json:"new_api_key"`
}

func (h *AdminHandler) RotateAPIKey(w http.ResponseWriter, r *http.Request) {
	// 1. Get TenantID from Context (set by middleware)
	tenantID, ok := r.Context().Value("tenant_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Generate Random Key
	newKey := uuid.New().String()

	// 3. Hash Key
	hash := sha256.Sum256([]byte(newKey))
	hashString := hex.EncodeToString(hash[:])

	// 4. Update DB (Saving last 4 chars)
	last4 := newKey[len(newKey)-4:]
	err := h.Repo.RotateTenantAPIKey(tenantID, hashString, last4)
	if err != nil {
		http.Error(w, "Failed to rotate key", http.StatusInternalServerError)
		return
	}

	// 5. Return Plaintext Key
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RotateKeyResponse{NewAPIKey: newKey})
}

type APIKeyStatusResponse struct {
	Status string `json:"status"`
	Mask   string `json:"mask"`
}

func (h *AdminHandler) GetAPIKeyStatus(w http.ResponseWriter, r *http.Request) {
	// 1. Get TenantID from Context
	tenantID, ok := r.Context().Value("tenant_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Check Tenant Existence
	tenant, err := h.Repo.GetTenantByID(tenantID)
	if err != nil {
		http.Error(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// 3. Return Status
	mask := "********************"
	if tenant.APIKeyLast4 != "" {
		mask = "****************" + tenant.APIKeyLast4
	}

	response := APIKeyStatusResponse{
		Status: "Active",
		Mask:   mask,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
