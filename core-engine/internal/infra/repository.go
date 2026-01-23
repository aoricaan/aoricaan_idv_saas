package infra

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/aoricaan/idv-core/internal/domain"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetTenantByAPIKeyHash(hash string) (*domain.Tenant, error) {
	var t domain.Tenant
	query := `SELECT id, name, branding_config FROM tenants WHERE api_key_hash = $1`
	err := r.db.QueryRow(query, hash).Scan(&t.ID, &t.Name, &t.BrandingConfig)
	if err == sql.ErrNoRows {
		return nil, errors.New("tenant not found")
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) GetFlowByName(tenantID string, flowName string) (*domain.Flow, error) {
	var f domain.Flow
	query := `SELECT id, name, steps_configuration FROM flows WHERE tenant_id = $1 AND name = $2`
	err := r.db.QueryRow(query, tenantID, flowName).Scan(&f.ID, &f.Name, &f.StepsConfiguration)
	if err == sql.ErrNoRows {
		return nil, errors.New("flow not found")
	}
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *Repository) GetFlowByID(flowID string) (*domain.Flow, error) {
	var f domain.Flow
	query := `SELECT id, name, steps_configuration FROM flows WHERE id = $1`
	err := r.db.QueryRow(query, flowID).Scan(&f.ID, &f.Name, &f.StepsConfiguration)
	if err == sql.ErrNoRows {
		return nil, errors.New("flow not found")
	}
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *Repository) CreateSession(s *domain.Session) error {
	query := `
		INSERT INTO sessions (token, flow_id, user_reference, expires_at, status, collected_data)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.db.Exec(query, s.Token, s.FlowID, s.UserReference, s.ExpiresAt, s.Status, s.CollectedData)
	if err != nil {
		return fmt.Errorf("failed to insert session: %w", err)
	}
	return nil
}

func (r *Repository) GetSessionByToken(token string) (*domain.Session, error) {
	var s domain.Session
	query := `SELECT token, flow_id, user_reference, current_step_index, status, collected_data, expires_at FROM sessions WHERE token = $1`
	err := r.db.QueryRow(query, token).Scan(&s.Token, &s.FlowID, &s.UserReference, &s.CurrentStepIndex, &s.Status, &s.CollectedData, &s.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, errors.New("session not found")
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) UpdateSession(s *domain.Session) error {
	query := `
        UPDATE sessions 
        SET current_step_index = $1, collected_data = $2, status = $3, updated_at = NOW()
        WHERE token = $4
    `
	_, err := r.db.Exec(query, s.CurrentStepIndex, s.CollectedData, s.Status, s.Token)
	if err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}
	return nil
}
