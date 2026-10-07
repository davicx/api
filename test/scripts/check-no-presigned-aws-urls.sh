#!/usr/bin/env bash
# Fail if presigned S3 query material is present (common leak: session token + access key in URLs).
# Run locally: npm run check:secrets
# Optional git hook: git config core.hooksPath .githooks
set -euo pipefail
set -o pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Built at runtime so this file is not matched by the repo scan below.
PATTERN="$(printf '%s%s' 'X-Amz-' 'Security-Token')|$(printf '%s%s' 'X-Amz-' 'Credential=')"

EXCLUDES=(
  --exclude-dir=node_modules
  --exclude-dir=.git
  --exclude-dir=coverage
)

if grep -rEn --binary-files=without-match "${EXCLUDES[@]}" "$PATTERN" . 2>/dev/null | grep -q .; then
  echo >&2 ""
  echo >&2 "ERROR: Do not commit presigned AWS URL query strings."
  echo >&2 "Remove signing query params; use cloudKey or generate URLs at runtime."
  echo >&2 ""
  grep -rEn --binary-files=without-match "${EXCLUDES[@]}" "$PATTERN" . 2>/dev/null || true
  echo >&2 ""
  exit 1
fi

echo "OK: no S3 presign query markers under ${ROOT}"
