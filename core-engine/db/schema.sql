-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL, -- SHA256 of the API Key
    api_key_last_4 VARCHAR(4),
    webhook_url TEXT,
    branding_config JSONB DEFAULT '{}',
    credits_balance INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: flows
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps_configuration JSONB NOT NULL, -- Array of StepConfig
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum for Session Status
CREATE TYPE session_status AS ENUM ('PENDING', 'IN_PROGRESS', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Table: sessions
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(64) PRIMARY KEY, -- Unique public token for frontend
    flow_id UUID REFERENCES flows(id),
    user_reference VARCHAR(255), -- Client's user ID
    current_step_index INT DEFAULT 0,
    status session_status DEFAULT 'PENDING',
    collected_data JSONB DEFAULT '{}', -- Encrypted metadata/results
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metadata for quick tenant lookup
CREATE INDEX idx_tenants_api_key_hash ON tenants(api_key_hash);

-- Table: tenant_users
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Bcrypt hash
    role VARCHAR(50) DEFAULT 'ADMIN', -- ADMIN, VIEWER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
