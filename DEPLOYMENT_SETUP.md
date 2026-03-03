# CI/CD Setup Guide for Mitbiz POS

This guide will walk you through setting up automated CI/CD deployment to Google Cloud Run.

## Prerequisites

- Google Cloud Project: `dulcet-outlook-479500-k3`
- GitHub repository with your code
- `gcloud` CLI installed locally (optional, for manual steps)

## Step 1: Enable Required Google Cloud APIs

Run these commands in your Google Cloud Console or locally with `gcloud`:

```bash
gcloud config set project dulcet-outlook-479500-k3

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable iamcredentials.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## Step 2: Set up Workload Identity Federation (Recommended)

This is more secure than using service account keys.

### 2.1 Create a Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding dulcet-outlook-479500-k3 \
  --member="serviceAccount:github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding dulcet-outlook-479500-k3 \
  --member="serviceAccount:github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding dulcet-outlook-479500-k3 \
  --member="serviceAccount:github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding dulcet-outlook-479500-k3 \
  --member="serviceAccount:github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding dulcet-outlook-479500-k3 \
  --member="serviceAccount:github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"

# Allow service account to act as itself
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

Replace:
- `PROJECT_NUMBER` with your Google Cloud project number (find in Cloud Console)
- `YOUR_GITHUB_USERNAME` with your GitHub username (e.g., `aliefadha`)
- `YOUR_REPO_NAME` with your repository name (e.g., `mitbiz-pos`)

### 2.2 Create Workload Identity Pool

```bash
# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="dulcet-outlook-479500-k3" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="dulcet-outlook-479500-k3" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 2.3 Get the Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="dulcet-outlook-479500-k3" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```

This will output something like:
```
projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

## Step 3: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

1. **WIF_PROVIDER**
   - Value: The full provider name from Step 2.3
   - Example: `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

2. **WIF_SERVICE_ACCOUNT**
   - Value: `github-actions@dulcet-outlook-479500-k3.iam.gserviceaccount.com`

## Step 4: Set up Backend Secrets (Optional - for now)

When you're ready to deploy the backend, create these secrets in Secret Manager:

```bash
# Create secrets (do this AFTER you've set up your database and other configs)
gcloud secrets create database-url --data-file=-
# Then paste your DATABASE_URL and press Ctrl+D

gcloud secrets create better-auth-secret --data-file=-
# Paste your BETTER_AUTH_SECRET (generate with: openssl rand -base64 32)

gcloud secrets create jwt-secret --data-file=-
# Paste your JWT_SECRET (generate with: openssl rand -base64 32)

gcloud secrets create smtp-pass --data-file=-
# Paste your SMTP password
```

## Step 5: Test the Setup

1. Commit and push the workflow files:
   ```bash
   git add .github/workflows/
   git commit -m "Add GitHub Actions CI/CD for Cloud Run deployment"
   git push origin main
   ```

2. Make a change to `frontend-pos/src/` and push:
   ```bash
   # Edit any file in frontend-pos/src/
   git add .
   git commit -m "Test frontend deployment"
   git push origin main
   ```

3. Go to GitHub → Actions tab to see the workflow running

4. Check Cloud Console → Cloud Run to see your deployed service

## Environment Variables

The backend has been configured to use environment variables from `.env` files instead of hardcoded values:

### Backend Environment Variables

- **ALLOWED_ORIGINS**: Comma-separated list of allowed CORS origins
  - Example: `https://frontend-pos-508482854424.us-central1.run.app,http://localhost:3000`
  - Used in: `main.ts`, `auth.ts`, `auth.module.ts`
  
- **BETTER_AUTH_URL**: The URL where Better Auth is hosted
  - Example: `https://backend-pos-508482854424.us-central1.run.app`
  
- **BETTER_AUTH_SECRET**: Secret key for Better Auth (min 32 chars)
  - Generate with: `openssl rand -base64 32`

### Frontend Environment Variables (Build-time)

- **VITE_API_URL**: Backend API URL
  - Example: `https://backend-pos-508482854424.us-central1.run.app/api`
  
- **VITE_APP_URL**: Frontend application URL
  - Example: `https://frontend-pos-508482854424.us-central1.run.app`

These are injected during the Docker build process in the Cloud Build configuration.

## How It Works

- **Frontend**: When you push changes to `frontend-pos/**`, it triggers the frontend workflow
  - Builds the Docker image with staging environment variables
  - Pushes to Artifact Registry
  - Deploys to Cloud Run

- **Backend**: When you push changes to `backend-pos/**`, it triggers the backend workflow
  - Builds the Docker image
  - Pushes to Artifact Registry
  - Deploys to Cloud Run with secrets from Secret Manager

## Monitoring

- View workflow runs: GitHub → Actions tab
- View deployed services: https://console.cloud.google.com/run
- View container images: https://console.cloud.google.com/artifacts

## Troubleshooting

### Workflow fails with authentication error
- Double-check the Workload Identity Provider name in `WIF_PROVIDER` secret
- Ensure the service account has the correct permissions

### Build fails
- Check Cloud Build logs in Google Cloud Console
- Ensure your Dockerfile is correct

### Deployment fails
- Check Cloud Run logs in Google Cloud Console
- Ensure the service name and region are correct

## Costs

As discussed, this should be **free** for your usage:
- Cloud Run: 2M requests/month free
- Cloud Build: ~120 build-minutes/day free
- Artifact Registry: 500MB storage free

You'd only pay if you exceed these limits significantly.

## Next Steps

1. Complete Step 1-3 above
2. Commit the workflow files
3. Test with a small change
4. Once frontend is working, set up backend secrets and test backend deployment
