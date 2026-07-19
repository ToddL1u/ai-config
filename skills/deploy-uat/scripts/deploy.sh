#!/bin/bash
# Deploy frontend projects to UAT via Jenkins API
# Usage:
#   deploy.sh <countries> [--repo=<name>]          → trigger build, print QUEUE_URL
#   deploy.sh --poll-queue=<url> [--repo=<name>]   → poll existing queue item (no new trigger)

set -euo pipefail

COUNTRIES=""
POLL_QUEUE=""
REPO="fe-web-mvc"

# Parse all arguments
for arg in "$@"; do
  case "$arg" in
    --poll-queue=*) POLL_QUEUE="${arg#--poll-queue=}" ;;
    --repo=*) REPO="${arg#--repo=}" ;;
    --*) ;;  # ignore unknown flags
    *) COUNTRIES="$arg" ;;
  esac
done

# Default country if not provided and not poll-only mode
if [[ -z "${COUNTRIES}" && -z "${POLL_QUEUE}" ]]; then
  COUNTRIES="ng"
fi

JENKINS_URL="${JENKINS_URL:?JENKINS_URL env var required}"
JENKINS_USER="${JENKINS_USER:?JENKINS_USER env var required}"
JENKINS_TOKEN="${JENKINS_TOKEN:?JENKINS_TOKEN env var required}"

JOB_PATH="job/TW-FE/job/${REPO}/job/uat"
BUILD_URL="${JENKINS_URL}/${JOB_PATH}"
AUTH="${JENKINS_USER}:${JENKINS_TOKEN}"

# ── Poll-only mode (no new build trigger) ────────────────────────────────────
if [[ -n "${POLL_QUEUE}" ]]; then
  BUILD_NUMBER=""
  for i in $(seq 1 20); do
    sleep 3
    QUEUE_JSON=$(curl -sS --user "${AUTH}" "${POLL_QUEUE}api/json" 2>/dev/null || true)
    BUILD_NUMBER=$(echo "${QUEUE_JSON}" | python3 -c "
import sys,json
try:
    data=json.load(sys.stdin)
    exe=data.get('executable')
    if exe: print(exe['number'])
except: pass
" 2>/dev/null)
    if [[ -n "${BUILD_NUMBER}" ]]; then
      break
    fi
  done

  if [[ -z "${BUILD_NUMBER}" ]]; then
    echo "WARN: Could not determine build number after 60s"
    exit 0
  fi

  echo "BUILD_NUMBER=${BUILD_NUMBER}"
  echo "BUILD_DETAIL_URL=${BUILD_URL}/${BUILD_NUMBER}/"

  while true; do
    sleep 30
    BUILD_JSON=$(curl -sS --user "${AUTH}" "${BUILD_URL}/${BUILD_NUMBER}/api/json?tree=result,building" 2>/dev/null || true)
    BUILDING=$(echo "${BUILD_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('building',''))" 2>/dev/null || true)
    RESULT=$(echo "${BUILD_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result','') or '')" 2>/dev/null || true)

    if [[ "${BUILDING}" == "False" && -n "${RESULT}" ]]; then
      echo "BUILD_RESULT=${RESULT}"
      echo "BUILD_FINISHED"
      exit 0
    fi
    echo "POLL: still building..."
  done
fi

# ── Trigger mode ─────────────────────────────────────────────────────────────

# Get CRUMB for CSRF protection
CRUMB_JSON=$(curl -sS --user "${AUTH}" "${JENKINS_URL}/crumbIssuer/api/json")
CRUMB_FIELD=$(echo "${CRUMB_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['crumbRequestField'])")
CRUMB_VALUE=$(echo "${CRUMB_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['crumb'])")

# Build POST body (Jenkins reads parameters from request body, not query string)
POST_BODY="countries=${COUNTRIES}&environment=uat&brand=sportybet&forceDeploy=false"
if [[ "${REPO}" == "fe-web-mvc" ]]; then
  POST_BODY="${POST_BODY}&excludedCountries=int1,za1&storybook=false"
fi

# Trigger build
RESPONSE=$(curl -sS -w "\n%{http_code}" \
  --user "${AUTH}" \
  -H "${CRUMB_FIELD}:${CRUMB_VALUE}" \
  -X POST "${BUILD_URL}/buildWithParameters" \
  --data "${POST_BODY}" \
  -D -)

QUEUE_URL=$(echo "${RESPONSE}" | grep -i "^location:" | tr -d '\r' | awk '{print $2}')
HTTP_CODE=$(echo "${RESPONSE}" | tail -1)

if [[ "${HTTP_CODE}" != "201" ]]; then
  echo "ERROR: Build trigger failed with HTTP ${HTTP_CODE}"
  echo "${RESPONSE}"
  exit 1
fi

echo "BUILD_TRIGGERED"
echo "REPO=${REPO}"
echo "COUNTRIES=${COUNTRIES}"
echo "QUEUE_URL=${QUEUE_URL}"
echo "CONSOLE_URL=${BUILD_URL}/lastBuild/console"
