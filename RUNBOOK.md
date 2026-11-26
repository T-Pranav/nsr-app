# NSR app – runbook

## How a change goes live
1. A change is made on a branch (not `main`). GitHub builds it and puts it on a **test copy**:
   `https://test-<branch>--nsr-poultry-farms.netlify.app` – try it on a phone.
2. When it looks right, merge the branch into `main` (pull request → **Merge**).
3. GitHub builds `main` and publishes it to the **live site** in about 2 minutes. Phones update themselves.

No zip uploads. Netlify keeps every published version.

## Roll back (about 1 minute)
Netlify → Sites → nsr-poultry-farms → **Deploys** → click an older green deploy → **Publish deploy**.
The live site switches back at once. Then fix the problem on a branch and merge again.

## Secrets (GitHub → repo Settings → Secrets and variables → Actions)
| Name | Where it comes from |
|---|---|
| `NETLIFY_SITE_ID` | Netlify → Site configuration → General → Site ID |
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |

## Firestore rules
Still pasted by hand from `firestore.rules` into Firebase → Firestore → Rules (moves to automatic in phase 2).

## Layout
- `src/index.html` – the layer-farm app (main source)
- `feedmill-src/`, `patches/`, `build_feedmill.py` – feed mill app
- `static/` – icons, fonts, manifest, service worker
- `build.py` – builds everything into `app/` (what Netlify serves)

## Live silo weights
- `netlify/functions/silo-live.mjs` answers `/api/silo-live` for signed-in staff only and holds the Poultry Manager secret.
- Netlify → Site configuration → Environment variables: `SILO_HOST`, `SILO_CLIENT_ID`, `SILO_CLIENT_SECRET`, `SILO_TENANT` (scope: Functions).
- It calls Poultry Manager at most once a minute. The hourly history still comes from the silo-sync job in nsr-backup.
- Functions are only published by this pipeline, not by dragging a zip onto Netlify.

## Rules publish themselves
- On every push to `main`, after the site deploys, `publish-rules.sh` publishes `firestore.rules` and `storage.rules` through the Firebase Rules API.
- One-time setup: run `setup-deploy.sh` in Google Cloud Shell, then add `GCP_DEPLOY_PROVIDER` and `GCP_DEPLOY_SA` as repository secrets.
- The `nsr-deploy` account can only change rules. It cannot read farm data. Only the `main` branch of this repository can use it.
- Without those two secrets the step is skipped and the site still deploys.
