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
	query := `SELECT id, name, branding_config, credits_balance FROM tenants WHERE api_key_hash = $1`
	err := r.db.QueryRow(query, hash).Scan(&t.ID, &t.Name, &t.BrandingConfig, &t.CreditsBalance)
	if err == sql.ErrNoRows {
		return nil, errors.New("tenant not found")
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) RotateTenantAPIKey(tenantID string, newHash string, last4 string) error {
	query := `UPDATE tenants SET api_key_hash = $1, api_key_last_4 = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.Exec(query, newHash, last4, tenantID)
	return err
}

func (r *Repository) GetTenantByID(id string) (*domain.Tenant, error) {
	var t domain.Tenant
	var last4 sql.NullString
	query := `SELECT id, name, branding_config, api_key_last_4, credits_balance FROM tenants WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&t.ID, &t.Name, &t.BrandingConfig, &last4, &t.CreditsBalance)
	if err == sql.ErrNoRows {
		return nil, errors.New("tenant not found")
	}
	if err != nil {
		return nil, err
	}
	if last4.Valid {
		t.APIKeyLast4 = last4.String
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

func (r *Repository) GetTenantUserByEmail(email string) (*domain.TenantUser, error) {
	query := `SELECT id, tenant_id, email, password_hash, role, created_at, updated_at FROM tenant_users WHERE email = $1`
	row := r.db.QueryRow(query, email)

	var user domain.TenantUser
	err := row.Scan(&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) AddCredits(tenantID string, amount int, description string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Update Balance
	_, err = tx.Exec(`UPDATE tenants SET credits_balance = credits_balance + $1, updated_at = NOW() WHERE id = $2`, amount, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update balance: %w", err)
	}

	// 2. Insert Transaction Log
	_, err = tx.Exec(`INSERT INTO credit_transactions (tenant_id, amount, description) VALUES ($1, $2, $3)`, tenantID, amount, description)
	if err != nil {
		return fmt.Errorf("failed to insert transaction: %w", err)
	}

	return tx.Commit()
}

func (r *Repository) GetCreditTransactions(tenantID string, limit int) ([]domain.CreditTransaction, error) {
	query := `SELECT id, tenant_id, amount, description, created_at FROM credit_transactions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`
	rows, err := r.db.Query(query, tenantID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []domain.CreditTransaction
	for rows.Next() {
		var tx domain.CreditTransaction
		if err := rows.Scan(&tx.ID, &tx.TenantID, &tx.Amount, &tx.Description, &tx.CreatedAt); err != nil {
			return nil, err
		}
		txs = append(txs, tx)
	}
	return txs, nil
}
