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
  curl -sS --fail-with-body "${H[@]}" -X PATCH "https://firebaserules.googleapis.com/v1/$REL" \
    -d "{\"release\":{\"name\":\"$REL\",\"rulesetName\":\"$RS\"}}" >/dev/null
  echo "✓ $1 published ($RS)"
}
publish firestore.rules cloud.firestore
if [ -n "$BUCKET" ]; then publish storage.rules "firebase.storage/$BUCKET"; else echo "No storageBucket in firebase-config.js – storage rules skipped"; fi
