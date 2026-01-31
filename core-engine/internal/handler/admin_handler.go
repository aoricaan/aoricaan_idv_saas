package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/aoricaan/idv-core/internal/config"
	"github.com/aoricaan/idv-core/internal/domain"
	"github.com/aoricaan/idv-core/internal/infra"
	"github.com/aoricaan/idv-core/internal/service"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	Repo    *infra.Repository
	Storage *service.StorageService
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

	// Generate Token
	tokenString, err := token.SignedString(config.GetJWTSecret())
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{Token: tokenString})
}

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	CompanyName string `json:"company_name"`
	TaxID       string `json:"tax_id"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
}

func (h *AdminHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic Validation
	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// 1. Check if user exists
	_, err := h.Repo.GetTenantUserByEmail(req.Email)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// 2. Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	// 3. Prepare Tenant Data (API Key generated later on demand)
	tenantID := uuid.New()
	tenantName := req.CompanyName
	if tenantName == "" {
		tenantName = fmt.Sprintf("%s %s", req.FirstName, req.LastName)
	}

	tenant := &domain.Tenant{
		ID:             tenantID,
		Name:           tenantName,
		APIKeyHash:     "", // Empty until generated
		APIKeyLast4:    "", // Empty until generated
		WebhookURL:     "",
		BrandingConfig: domain.JSONB{"primary_color": "#4F46E5"},
		CreditsBalance: 10,
	}

	// 5. Prepare User Data
	userID := uuid.New()
	user := &domain.TenantUser{
		ID:           userID,
		TenantID:     tenantID,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "ADMIN",
	}

	// 6. DB Transaction
	err = h.Repo.RegisterTenant(tenant, user)
	if err != nil {
		log.Printf("ERROR: Register failed: %v", err)
		http.Error(w, "Registration failed", http.StatusInternalServerError)
		return
	}

	// 7. Auto-Login (Generate Token)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":       user.ID,
		"tenant_id": user.TenantID,
		"role":      user.Role,
		"exp":       time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(config.GetJWTSecret())
	if err != nil {
		w.WriteHeader(http.StatusCreated)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
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
	log.Printf("DEBUG: Rotating Key for Tenant: %s\n", tenantID)
	err := h.Repo.RotateTenantAPIKey(tenantID, hashString, last4)
	if err != nil {
		log.Printf("ERROR: Failed to rotate key: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to rotate key: %v", err), http.StatusInternalServerError)
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
	status := "Active"
	mask := "********************"

	if tenant.APIKeyLast4 == "" {
		status = "Inactive"
		mask = "Not Generated"
	} else {
		mask = "****************" + tenant.APIKeyLast4
	}

	response := APIKeyStatusResponse{
		Status: status,
		Mask:   mask,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Credits Response
type CreditsResponse struct {
	Balance      int                        `json:"balance"`
	Transactions []domain.CreditTransaction `json:"transactions"`
}

func (h *AdminHandler) GetCredits(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	tenantID := r.Context().Value("tenant_id").(string)

	// 1. Get Tenant for Balance
	tenant, err := h.Repo.GetTenantByID(tenantID)
	if err != nil {
		http.Error(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// 2. Get Transactions
	txs, err := h.Repo.GetCreditTransactions(tenantID, 5) // Last 5
	if err != nil {
		http.Error(w, "Failed to fetch transactions", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(CreditsResponse{
		Balance:      tenant.CreditsBalance,
		Transactions: txs,
	})
}

// Request for adding credits
type AddCreditsRequest struct {
	Amount      int    `json:"amount"`
	Description string `json:"description"`
}

func (h *AdminHandler) AddCredits(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value("tenant_id").(string)

	var req AddCreditsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := h.Repo.AddCredits(tenantID, req.Amount, req.Description)
	if err != nil {
		http.Error(w, "Failed to add credits", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) SimulateUsage(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value("tenant_id").(string)

	// Deduct 1 credit
	err := h.Repo.AddCredits(tenantID, -1, "Verification Usage (Simulation)")
	if err != nil {
		http.Error(w, "Failed to deduct credit", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ----------------------------------------
// Admin Review Endpoints
// ----------------------------------------

func (h *AdminHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	tenantID, _ := r.Context().Value("tenant_id").(string)
	search := r.URL.Query().Get("search")

	sessions, err := h.Repo.ListSessions(tenantID, 50, search)
	if err != nil {
		fmt.Printf("ERROR: Failed to list sessions: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to list sessions: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

type SessionReviewResponse struct {
	Session  *domain.Session   `json:"session"`
	Images   map[string]string `json:"images"` // Presigned URLs
	TenantID string            `json:"tenant_id"`
}

func (h *AdminHandler) GetSessionReview(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	session, err := h.Repo.GetSessionByToken(token)
	if err != nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	// 2. Generate Presigned GET URLs for artifacts
	images := make(map[string]string)

	// Helper to sign if exists
	sign := func(keyName string) {
		if val, ok := session.CollectedData[keyName].(string); ok && val != "" {
			url, err := h.Storage.GeneratePresignedGetURL(r.Context(), val)
			if err == nil {
				images[keyName] = url
			}
		}
	}

	sign("document_front")
	sign("selfie")

	resp := SessionReviewResponse{
		Session:  session,
		Images:   images,
		TenantID: session.FlowID.String(), // Approximate
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type ReviewDecisionRequest struct {
	Status string `json:"status"` // approved, rejected
	Reason string `json:"reason"`
}

func (h *AdminHandler) DecideSession(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	var req ReviewDecisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	// Validate status
	upperStatus := strings.ToUpper(req.Status)
	status := domain.SessionStatus(upperStatus)
	if status != domain.StatusApproved && status != domain.StatusRejected {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	// Update DB
	err := h.Repo.UpdateSessionStatus(token, status)
	if err != nil {
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
