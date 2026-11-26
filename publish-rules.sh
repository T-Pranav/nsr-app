#!/bin/bash
# Publish firestore.rules and storage.rules through the Firebase Rules API.
# Needs ACCESS_TOKEN (from the keyless sign-in). The account only has "Firebase Rules Admin".
set -euo pipefail
P=nsr-poultry-farms
API=https://firebaserules.googleapis.com/v1/projects/$P
BUCKET=$(grep -o 'storageBucket *: *"[^"]*"' static/firebase-config.js | sed -E 's/.*"([^"]*)"/\1/')
H=(-H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json")
publish() { # $1 rules file  $2 release name
  BODY=$(python3 -c 'import json,sys;print(json.dumps({"source":{"files":[{"name":sys.argv[1],"content":open(sys.argv[1]).read()}]}}))' "$1")
  RS=$(curl -sS --fail-with-body "${H[@]}" -X POST "$API/rulesets" -d "$BODY" | python3 -c 'import json,sys;print(json.load(sys.stdin)["name"])')
  REL="projects/$P/releases/$2"
  # update the release if it exists, otherwise create it
  if curl -sS -o /dev/null -w '%{http_code}' "${H[@]}" "https://firebaserules.googleapis.com/v1/$REL" | grep -q '^200$'; then
    curl -sS --fail-with-body "${H[@]}" -X PATCH "https://firebaserules.googleapis.com/v1/$REL" \
      -d "{\"release\":{\"name\":\"$REL\",\"rulesetName\":\"$RS\"}}" >/dev/null
  else
    curl -sS --fail-with-body "${H[@]}" -X POST "$API/releases" -d "{\"name\":\"$REL\",\"rulesetName\":\"$RS\"}" >/dev/null
  fi
  echo "✓ $1 published ($RS)"
}
publish firestore.rules cloud.firestore
# the storage release is named after the bucket; use the one Firebase already has if it exists
SREL=$(curl -sS "${H[@]}" "$API/releases?filter=name=projects/$P/releases/firebase.storage/*" | python3 -c 'import json,sys
for r in json.load(sys.stdin).get("releases",[]):
    n=r["name"].split("/releases/")[1]
    if n.startswith("firebase.storage/"): print(n); break' || true)
echo "Storage release: ${SREL:-firebase.storage/$BUCKET}"
if [ -n "$SREL" ]; then publish storage.rules "$SREL"; elif [ -n "$BUCKET" ]; then publish storage.rules "firebase.storage/$BUCKET"; else echo "No storage bucket found – storage rules skipped"; fi
