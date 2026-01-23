# Aoricaan IDV SaaS - Local Development Walkthrough

This guide details how to run the Identity Verification (IDV) SaaS platform locally using Docker.

## Prerequisites
- Docker & Docker Compose
- Make (optional, for convenience)

## 1. Quick Start (Run Everything)

```bash
cd infra-local
make up
# OR
docker compose up -d --build
```

This starts:
- **Postgres** (DB): `localhost:5432`
- **Redis** (Cache): `localhost:6379`
- **MinIO** (S3): `localhost:9000` (Console: `localhost:9001`)
- **Core Engine** (Backend): `localhost:8080`
- **Secure Web** (Frontend): `localhost:3000`

## 2. End-to-End Demo (The "Happy Path")

To verify the full verification flow:

### Step 1: Create a Session (API)
Simulate a client backend requesting a verification session.

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/sessions" -Method Post -Headers @{Authorization="secret-api-key"} -ContentType "application/json" -Body '{"flow_id": "onboarding_flow", "user_reference": "demo_user_01"}'
```

**Linux/Mac (cURL):**
```bash
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Authorization: secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"flow_id": "onboarding_flow", "user_reference": "demo_user_01"}'
```

**Response:**
You will receive a JSON with a `redirect_url` containing a token.
```json
{
    "redirect_url": "http://localhost:3000/start?token=YOUR_UUID_TOKEN",
    "expires_in": 900
}
```

### Step 2: Complete the Flow (Frontend)
1. **Open the Link**: Paste the `redirect_url` into your browser.
2. **Welcome Screen**: You should see the first step: **"Document Capture (front)"**.
3. **Capture**: Click **"Capture & Continue"**. ignoring the dummy camera.
   - *Behind the scenes*: The frontend sends a POST to `/submit`, the backend advances the state.
4. **Selfie Step**: The UI automatically updates to **"Selfie Verification"**.
5. **Finish**: Click **"Take Selfie & Finish"**.
6. **Completion**: The UI shows **"Verification Complete!"**.

## 3. Useful Commands

| Action | Command (in `infra-local/`) |
|---|---|
| Start All | `make up` |
| Stop All | `make down` |
| Rebuild Backend | `docker compose up -d --build core-engine` |
| Rebuild Frontend | `docker compose up -d --build secure-flow-web` |
| Logs (Backend) | `docker logs -f idv_core` |
| DB Shell | `docker exec -it idv_postgres psql -U user -d idv_core` |

## 4. Current State (MVP Phase 3)
- **Database**: Seeded with Tenant 'DemoCorp' and Flow 'onboarding_flow'.
- **Backend**: Handles Session Creation, State Management, and Step Navigation.
- **Frontend**: Renders dynamic steps (`DocumentCapture`, `SelfieCapture`) based on Backend state.

**Next Steps**:
- Real image upload to MinIO.
- Real camera integration in Frontend.
- Admin Dashboard to view results.
