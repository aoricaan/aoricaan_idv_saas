package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/aoricaan/idv-core/internal/domain"
	"github.com/aoricaan/idv-core/internal/infra"
	"github.com/aoricaan/idv-core/internal/service"
	"github.com/google/uuid"
)

type SessionHandler struct {
	Repo    *infra.Repository
	Storage *service.StorageService
}

type InitSessionRequest struct {
	FlowID        string `json:"flow_id"` // client sends flow name/id
	UserReference string `json:"user_reference"`
}

type InitSessionResponse struct {
	RedirectURL string `json:"redirect_url"`
	ExpiresIn   int    `json:"expires_in"`
}

type GetSessionResponse struct {
	Session  *domain.Session    `json:"session"`
	NextStep *domain.StepConfig `json:"next_step,omitempty"`
	Tenant   *domain.Tenant     `json:"tenant,omitempty"`
}

type SubmitStepRequest struct {
	Data map[string]interface{} `json:"data"`
}

func (h *SessionHandler) SubmitStep(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	// 1. Get Session
	session, err := h.Repo.GetSessionByToken(token)
	if err != nil {
		http.Error(w, "Invalid session", http.StatusNotFound)
		return
	}

	// 2. Decode Data
	var req SubmitStepRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	// 3. Update Session Data (Merge)
	for k, v := range req.Data {
		session.CollectedData[k] = v
	}

	// 4. Advance Step
	session.CurrentStepIndex++

	// 5. Check if Flow is Complete
	flow, err := h.Repo.GetFlowByID(session.FlowID.String())
	if err == nil {
		if session.CurrentStepIndex >= len(flow.StepsConfiguration) {
			session.Status = domain.StatusInProgress
		}
	}

	// 6. Save
	if err := h.Repo.UpdateSession(session); err != nil {
		http.Error(w, "Failed to update session", http.StatusInternalServerError)
		return
	}

	// 7. Return Next State
	var nextStep *domain.StepConfig
	if err == nil && session.CurrentStepIndex < len(flow.StepsConfiguration) {
		step := flow.StepsConfiguration[session.CurrentStepIndex]
		nextStep = &step
	}

	resp := GetSessionResponse{
		Session:  session,
		NextStep: nextStep,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(resp)
}

func (h *SessionHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	session, err := h.Repo.GetSessionByToken(token)
	if err != nil {
		http.Error(w, "Invalid or expired session", http.StatusNotFound)
		return
	}

	// Fetch Flow to get the Step Config
	flow, err := h.Repo.GetFlowByID(session.FlowID.String())
	if err != nil {
		http.Error(w, "Flow configuration not found", http.StatusInternalServerError)
		return
	}

	var nextStep *domain.StepConfig
	if session.CurrentStepIndex < len(flow.StepsConfiguration) {
		step := flow.StepsConfiguration[session.CurrentStepIndex]
		nextStep = &step
	}

	resp := GetSessionResponse{
		Session:  session,
		NextStep: nextStep,
	}

	w.Header().Set("Content-Type", "application/json")
	// Enable CORS for frontend dev
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(resp)
}

func (h *SessionHandler) InitSession(w http.ResponseWriter, r *http.Request) {
	// 1. Validate Auth Header
	apiKey := r.Header.Get("Authorization")
	if apiKey == "" {
		http.Error(w, "Missing Authorization Header", http.StatusUnauthorized)
		return
	}

	// Hash the key to look it up
	hasher := sha256.New()
	hasher.Write([]byte(apiKey))
	apiKeyHash := hex.EncodeToString(hasher.Sum(nil))

	// DEBUG LOG
	fmt.Printf("DEBUG: Received Key: %s, Calculated Hash: %s\n", apiKey, apiKeyHash)

	tenant, err := h.Repo.GetTenantByAPIKeyHash(apiKeyHash)
	if err != nil {
		fmt.Printf("DEBUG: Repo Error: %v\n", err)
		http.Error(w, "Invalid API Key", http.StatusUnauthorized)
		return
	}

	// 2. Decode Body
	var req InitSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request Body", http.StatusBadRequest)
		return
	}

	// 3. Find Flow
	// For MVP, we assume the Client sends the FLOW NAME or ID.
	// Adapting to use FlowName if ID is not UUID, or just simple FlowName lookup
	flow, err := h.Repo.GetFlowByName(tenant.ID.String(), req.FlowID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Flow not found: %v", err), http.StatusBadRequest)
		return
	}

	// 4. Create Session
	token := uuid.New().String() // Using UUID as token for now. In prod use crypto/rand
	expiresIn := 900             // 15 minutes

	session := &domain.Session{
		Token:         token,
		FlowID:        flow.ID,
		UserReference: req.UserReference,
		Status:        domain.StatusPending,
		ExpiresAt:     time.Now().Add(time.Duration(expiresIn) * time.Second),
		CollectedData: domain.JSONB{},
	}

	if err := h.Repo.CreateSession(session); err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// 5. Response
	resp := InitSessionResponse{
		RedirectURL: fmt.Sprintf("http://localhost:3000/start?token=%s", token),
		ExpiresIn:   expiresIn,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type UploadURLRequest struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
}

type UploadURLResponse struct {
	UploadURL string `json:"upload_url"`
	FileKey   string `json:"file_key"`
}

func (h *SessionHandler) GenerateUploadURL(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	session, err := h.Repo.GetSessionByToken(token)
	if err != nil {
		http.Error(w, "Invalid session", http.StatusNotFound)
		return
	}

	var req UploadURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	// TODO: Validate content type (e.g. image/jpeg, image/png only)

	// Fetch Tenant to use ID in path (optimization: could add TenantID to Session struct)
	// For MVP, using default tenant ID. Ideally we validate flow ownership.

	uploadURL, fileKey, err := h.Storage.GeneratePresignedUploadURL(
		r.Context(),
		"tenant-default", // TODO: Fetch real tenant ID from Flow
		session.Token,
		req.Filename,
	)
	if err != nil {
		http.Error(w, "Failed to generate upload URL", http.StatusInternalServerError)
		return
	}

	resp := UploadURLResponse{
		UploadURL: uploadURL,
		FileKey:   fileKey,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*") // CORS
	json.NewEncoder(w).Encode(resp)
}
