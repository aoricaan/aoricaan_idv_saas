-- Calculate SHA256 of 'secret-api-key' for manual testing
-- echo -n "secret-api-key" | sha256sum -> a91122a27845347209bb451000b90c10972b9a715a206aa1670985223c72b834

INSERT INTO tenants (id, name, api_key_hash, webhook_url)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'DemoCorp',
    'a91122a27845347209bb451000b90c10972b9a715a206aa1670985223c72b834',
    'https://example.com/webhook'
) ON CONFLICT DO NOTHING;

INSERT INTO flows (id, tenant_id, name, steps_configuration)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'onboarding_flow',
    '[
        {"step_id": "step1", "type": "document_capture", "config": {"side": "front"}},
        {"step_id": "step2", "type": "selfie", "config": {}}
    ]'
) ON CONFLICT DO NOTHING;

-- Seed Tenant User (password: "admin123")
INSERT INTO tenant_users (tenant_id, email, password_hash)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@democorp.com',
    '$2a$10$k/9/MTuevlEX61TDk366BeV9S2CmM2qqOcqacZwna03hADnepz45G'
);
