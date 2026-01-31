package handler

import (
	"encoding/json"
	"net/http"

	"github.com/aoricaan/idv-core/internal/domain"
	"github.com/aoricaan/idv-core/internal/infra"
	"github.com/google/uuid"
)

type TemplateHandler struct {
	Repo *infra.Repository
}

func NewTemplateHandler(repo *infra.Repository) *TemplateHandler {
	return &TemplateHandler{Repo: repo}
}

func (h *TemplateHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.Repo.ListStepTemplates()
	if err != nil {
		http.Error(w, "Failed to fetch templates", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

func (h *TemplateHandler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req domain.StepTemplate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.ID = uuid.New() // Ensure new ID
	// Default to non-system for user created templates
	req.IsSystem = false
	// Basic Slug generation if empty
	if req.Slug == "" {
		req.Slug = req.Name // Ideally should be slugified
	}

	if err := h.Repo.CreateStepTemplate(&req); err != nil {
		http.Error(w, "Failed to create template", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

func (h *TemplateHandler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	existing, err := h.Repo.GetStepTemplateByID(id)
	if err != nil {
		http.Error(w, "Template not found", http.StatusNotFound)
		return
	}

	if existing.IsSystem {
		http.Error(w, "Cannot edit system templates", http.StatusForbidden)
		return
	}

	var req domain.StepTemplate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update allowed fields
	existing.Name = req.Name
	existing.Description = req.Description
	existing.BaseConfig = req.BaseConfig

	if err := h.Repo.UpdateStepTemplate(existing); err != nil {
		http.Error(w, "Failed to update template", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(existing)
}

func (h *TemplateHandler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	existing, err := h.Repo.GetStepTemplateByID(id)
	if err != nil {
		http.Error(w, "Template not found", http.StatusNotFound)
		return
	}

	if existing.IsSystem {
		http.Error(w, "Cannot delete system templates", http.StatusForbidden)
		return
	}

	if err := h.Repo.DeleteStepTemplate(id); err != nil {
		http.Error(w, "Failed to delete template", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
