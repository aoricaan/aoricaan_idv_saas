package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// JSONB is a helper for handling JSONB fields in Postgres
type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &j)
}

type Tenant struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	APIKeyHash     string    `json:"-"` // Never expose hash
	WebhookURL     string    `json:"webhook_url"`
	BrandingConfig JSONB     `json:"branding_config"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type StepConfig struct {
	StepID string                 `json:"step_id"`
	Type   string                 `json:"type"`
	Config map[string]interface{} `json:"config"`
}

// SQL helper for StepConfig array
type StepsConfig []StepConfig

func (s StepsConfig) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *StepsConfig) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &s)
}

type Flow struct {
	ID                 uuid.UUID   `json:"id"`
	TenantID           uuid.UUID   `json:"tenant_id"`
	Name               string      `json:"name"`
	Description        string      `json:"description"`
	StepsConfiguration StepsConfig `json:"steps_configuration"`
	CreatedAt          time.Time   `json:"created_at"`
	UpdatedAt          time.Time   `json:"updated_at"`
}

type SessionStatus string

const (
	StatusPending    SessionStatus = "PENDING"
	StatusInProgress SessionStatus = "IN_PROGRESS"
	StatusApproved   SessionStatus = "APPROVED"
	StatusRejected   SessionStatus = "REJECTED"
	StatusExpired    SessionStatus = "EXPIRED"
)

type Session struct {
	Token            string        `json:"token"`
	FlowID           uuid.UUID     `json:"flow_id"`
	UserReference    string        `json:"user_reference"`
	CurrentStepIndex int           `json:"current_step_index"`
	Status           SessionStatus `json:"status"`
	CollectedData    JSONB         `json:"collected_data"`
	ExpiresAt        time.Time     `json:"expires_at"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}
