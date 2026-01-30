# Aoricaan IDV SaaS Platform

A unified Identity Verification (IDV) platform featuring a Core Engine, Secure User Flow, and Admin Portal.

## 🏗️ Architecture

- **Core Engine (Backend)**: Go (Golang) REST API. Handles session logic, state machine, and storage.
- **Secure Flow Web (Frontend)**: React + Vite. The interface for end-users to submit documents.
- **Admin Portal (Frontend)**: React + Tailwind. Dashboard for tenants to manage keys, credits, and review verifications.
- **Infrastructure**: Docker Compose (Postgres, Redis, MinIO).

## 🚀 Prerequisites

- Docker & Docker Compose
- Git

## 🛠️ Installation & First Run

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd aoricaan_idv_saas
   ```

2. **Start the Platform**:
   ```bash
   cd infra-local
   docker compose up -d --build
   ```
   *Wait a few moments for Postgres and MinIO to initialize.*

3. **Verify Services**:
   - **Backend**: [http://localhost:8080/health](http://localhost:8080/health) -> `{"status":"ok"}`
   - **Admin Portal**: [http://localhost:3001](http://localhost:3001)
   - **Secure Flow**: [http://localhost:3000](http://localhost:3000)
   - **MinIO Console**: [http://localhost:9001](http://localhost:9001) (User/Pass: `minioadmin` / `minioadmin`)

---

## 📖 Usage Guide (The "Happy Path")

Follow these steps to complete a full verification cycle.

### Step 1: Admin Setup
1. Open the **Admin Portal** at [http://localhost:3001](http://localhost:3001).
2. Login with the demo credentials:
   - **Email**: `admin@democorp.com`
   - **Password**: `adminpassword`
3. In the Dashboard:
   - **Rotate API Key**: Click "Rotate Key" to generate your first API Key. **Copy this key**.
   - **Add Credits**: Ensure you have credits. Click "Simulate Usage" to test deduction, or use "Add Credits" to top up.

### Step 2: Create a Verification Session (Backend API)
Simulate your backend server creating a session for a user. Run this command in your terminal:

**Windows (PowerShell):**
```powershell
$apiKey = "YOUR_COPIED_API_KEY_HERE"
$body = @{
    flow_id = "onboarding_flow"
    user_reference = "john.doe@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/sessions" `
    -Method Post `
    -Headers @{Authorization=$apiKey} `
    -ContentType "application/json" `
    -Body $body
```

**Linux/Mac (cURL):**
```bash
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Authorization: YOUR_COPIED_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"flow_id": "onboarding_flow", "user_reference": "john.doe@example.com"}'
```

**Response:**
You will receive a JSON response containing a `redirect_url` with a unique token.

### Step 3: Complete Verification (User Flow)
1. **Open the Link**: Copy the `redirect_url` (e.g., `http://localhost:3000/start?token=...`) into your browser.
2. **Follow Instructions**:
   - **Front ID**: Upload an image.
   - **Selfie**: Upload an image.
3. **Finish**: Click "Finish". The stats will change to **"Review Required"**.

### Step 4: Admin Review
1. Return to the **Admin Portal** ([http://localhost:3001](http://localhost:3001)).
2. Go to the **"Verifications"** tab in the sidebar.
3. You should see your session in the list (Status: `REVIEW_REQUIRED`).
   - *Tip: Use the Search Bar to filter by User Reference.*
4. Click on the session to view details.
5. Review the uploaded images and click **Approve** or **Reject**.

---


## 🔧 Useful Commands

| Action | Command (in `infra-local/`) |
|---|---|
| **Start All** | `docker compose up -d` |
| **Stop All** | `docker compose down` |
| **Rebuild Backend** | `docker compose up -d --build core-engine` |
| **Rebuild Frontend** | `docker compose up -d --build secure-flow-web` |
| **Logs** | `docker compose logs -f` |

## ❓ Troubleshooting

### Persistent 500 Errors / DB Schema Issues
If you encounter 500 errors (e.g., during API Key rotation) or missing database columns:
**Fix:**
```bash
cd infra-local
docker compose down -v  # Wipes volumes (data) to force schema application
docker compose up -d --build
```
*Warning: This will delete all local data.*

