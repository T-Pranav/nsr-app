#!/bin/bash
# NSR app – lets GitHub publish the Firebase rules by itself (keyless, no key file).
# Run once in Google Cloud Shell:  bash setup-deploy.sh T-Pranav/nsr-app
set -e
REPO="${1:-T-Pranav/nsr-app}"
PROJECT=nsr-poultry-farms
SA=nsr-deploy@$PROJECT.iam.gserviceaccount.com
gcloud config set project $PROJECT >/dev/null
PN=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
echo "1/4 Turning on the services…"
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com firebaserules.googleapis.com
echo "2/4 Creating a rules-only account (it cannot read farm data)…"
gcloud iam service-accounts describe $SA >/dev/null 2>&1 || gcloud iam service-accounts create nsr-deploy --display-name="NSR rules publisher"
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/firebaserules.admin --condition=None >/dev/null
gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/serviceusage.serviceUsageConsumer --condition=None >/dev/null
echo "3/4 Trusting ONLY your GitHub repository $REPO…"
gcloud iam workload-identity-pools describe github --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers describe nsr-app --location=global --workload-identity-pool=github >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc nsr-app --location=global --workload-identity-pool=github \
    --display-name="NSR app repo" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='$REPO' && assertion.ref=='refs/heads/main'"
echo "4/4 Connecting the two…"
gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null
echo
echo "DONE. Add these two secrets in the nsr-app repository (Settings → Secrets and variables → Actions):"
echo "  GCP_DEPLOY_PROVIDER = projects/$PN/locations/global/workloadIdentityPools/github/providers/nsr-app"
echo "  GCP_DEPLOY_SA       = $SA"
