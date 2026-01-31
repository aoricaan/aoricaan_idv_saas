package infra

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

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
	log.Printf("REPO: Updating Tenant %s with hash len %d and last4 %s", tenantID, len(newHash), last4)
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
	query := `SELECT id, tenant_id, name, steps_configuration FROM flows WHERE id = $1`
	err := r.db.QueryRow(query, flowID).Scan(&f.ID, &f.TenantID, &f.Name, &f.StepsConfiguration)
	if err == sql.ErrNoRows {
		return nil, errors.New("flow not found")
	}
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *Repository) CreateFlow(f *domain.Flow) error {
	query := `
		INSERT INTO flows (id, tenant_id, name, description, steps_configuration, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(query, f.ID, f.TenantID, f.Name, f.Description, f.StepsConfiguration, f.CreatedAt, f.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create flow: %w", err)
	}
	return nil
}

func (r *Repository) UpdateFlow(f *domain.Flow) error {
	query := `
		UPDATE flows 
		SET name = $1, description = $2, steps_configuration = $3, updated_at = $4
		WHERE id = $5
	`
	_, err := r.db.Exec(query, f.Name, f.Description, f.StepsConfiguration, f.UpdatedAt, f.ID)
	if err != nil {
		return fmt.Errorf("failed to update flow: %w", err)
	}
	return nil
}

func (r *Repository) ListStepTemplates(tenantID string) ([]domain.StepTemplate, error) {
	query := `SELECT id, tenant_id, slug, name, description, strategy, base_config, is_system FROM step_templates WHERE tenant_id = $1 OR is_system = TRUE`
	rows, err := r.db.Query(query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []domain.StepTemplate
	for rows.Next() {
		var t domain.StepTemplate
		if err := rows.Scan(&t.ID, &t.TenantID, &t.Slug, &t.Name, &t.Description, &t.Strategy, &t.BaseConfig, &t.IsSystem); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (r *Repository) GetStepTemplateByID(id string, tenantID string) (*domain.StepTemplate, error) {
	query := `SELECT id, tenant_id, slug, name, description, strategy, base_config, is_system FROM step_templates WHERE id = $1 AND (tenant_id = $2 OR is_system = TRUE)`
	var t domain.StepTemplate
	err := r.db.QueryRow(query, id, tenantID).Scan(&t.ID, &t.TenantID, &t.Slug, &t.Name, &t.Description, &t.Strategy, &t.BaseConfig, &t.IsSystem)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) CreateStepTemplate(t *domain.StepTemplate) error {
	query := `INSERT INTO step_templates (id, tenant_id, slug, name, description, strategy, base_config, is_system, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.Exec(query, t.ID, t.TenantID, t.Slug, t.Name, t.Description, t.Strategy, t.BaseConfig, t.IsSystem, t.CreatedAt, t.UpdatedAt)
	return err
}

func (r *Repository) UpdateStepTemplate(t *domain.StepTemplate) error {
	query := `UPDATE step_templates SET name=$1, description=$2, base_config=$3, updated_at=$4 WHERE id=$5 AND tenant_id=$6`
	_, err := r.db.Exec(query, t.Name, t.Description, t.BaseConfig, t.UpdatedAt, t.ID, t.TenantID)
	return err
}

func (r *Repository) DeleteStepTemplate(id string, tenantID string) error {
	query := `DELETE FROM step_templates WHERE id=$1 AND tenant_id=$2`
	_, err := r.db.Exec(query, id, tenantID)
	return err
}

func (r *Repository) DeleteFlow(id string) error {
	// Manual Cascade: Delete associated sessions first
	_, err := r.db.Exec(`DELETE FROM sessions WHERE flow_id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete associated sessions: %w", err)
	}

	query := `DELETE FROM flows WHERE id = $1`
	_, err = r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete flow: %w", err)
	}
	return nil
}

func (r *Repository) ListFlows(tenantID string) ([]domain.Flow, error) {
	query := `SELECT id, tenant_id, name, description, steps_configuration, created_at, updated_at FROM flows WHERE tenant_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var flows []domain.Flow
	for rows.Next() {
		var f domain.Flow
		if err := rows.Scan(&f.ID, &f.TenantID, &f.Name, &f.Description, &f.StepsConfiguration, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		flows = append(flows, f)
	}
	return flows, nil
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

func (r *Repository) ListSessions(tenantID string, limit int, search string) ([]domain.Session, error) {
	// Base query
	query := `
		SELECT token, flow_id, user_reference, current_step_index, status, created_at 
		FROM sessions 
		WHERE flow_id IN (SELECT id FROM flows WHERE tenant_id = $1)
	`
	args := []interface{}{tenantID}
	argIdx := 2

	// Add search filter if provided
	if search != "" {
		query += fmt.Sprintf(" AND user_reference ILIKE $%d", argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// Add Order and Limit
	// Prioritize REVIEW_REQUIRED, then PENDING, then others
	query += fmt.Sprintf(`
		ORDER BY 
			CASE 
				WHEN status = 'REVIEW_REQUIRED' THEN 0 
				WHEN status = 'PENDING' THEN 1 
				ELSE 2 
			END, 
			created_at DESC 
		LIMIT $%d`, argIdx)

	args = append(args, limit)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []domain.Session
	for rows.Next() {
		var s domain.Session
		var createdAt time.Time // Scan into local variable if needed or add to struct
		// Scan simplified for list view
		if err := rows.Scan(&s.Token, &s.FlowID, &s.UserReference, &s.CurrentStepIndex, &s.Status, &createdAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *Repository) UpdateSessionStatus(token string, status domain.SessionStatus) error {
	query := `UPDATE sessions SET status = $1, updated_at = NOW() WHERE token = $2`
	_, err := r.db.Exec(query, status, token)
	return err
}
func (r *Repository) RegisterTenant(t *domain.Tenant, u *domain.TenantUser) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Insert Tenant
	queryTenant := `
		INSERT INTO tenants (id, name, api_key_hash, api_key_last_4, webhook_url, branding_config, credits_balance, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
	`
	_, err = tx.Exec(queryTenant, t.ID, t.Name, t.APIKeyHash, t.APIKeyLast4, t.WebhookURL, t.BrandingConfig, t.CreditsBalance)
	if err != nil {
		return fmt.Errorf("failed to insert tenant: %w", err)
	}

	// 2. Insert User
	queryUser := `
		INSERT INTO tenant_users (id, tenant_id, email, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
	`
	_, err = tx.Exec(queryUser, u.ID, u.TenantID, u.Email, u.PasswordHash, u.Role)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}

	return tx.Commit()
}
