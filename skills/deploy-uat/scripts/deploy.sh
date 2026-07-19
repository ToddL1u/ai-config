#!/bin/bash
# Trigger or poll a supported frontend UAT deployment through Jenkins.

set -euo pipefail

COUNTRIES=""
POLL_QUEUE=""
REPO="fe-web-mvc"
REPO_SET=false

for arg in "$@"; do
  case "$arg" in
    --poll-queue=*)
      [[ -z "$POLL_QUEUE" ]] || { echo "ERROR: duplicate --poll-queue" >&2; exit 2; }
      POLL_QUEUE="${arg#--poll-queue=}"
      [[ -n "$POLL_QUEUE" ]] || { echo "ERROR: empty --poll-queue" >&2; exit 2; }
      ;;
    --repo=*)
      [[ "$REPO_SET" == false ]] || { echo "ERROR: duplicate --repo" >&2; exit 2; }
      REPO="${arg#--repo=}"
      REPO_SET=true
      ;;
    --*)
      echo "ERROR: unknown flag: $arg" >&2
      exit 2
      ;;
    *)
      [[ -z "$COUNTRIES" ]] || { echo "ERROR: unexpected argument: $arg" >&2; exit 2; }
      COUNTRIES="$arg"
      ;;
  esac
done

case "$REPO" in
  fe-web-mvc|fe-management) ;;
  *) echo "ERROR: unsupported repo: $REPO" >&2; exit 2 ;;
esac

if [[ -n "$POLL_QUEUE" && -n "$COUNTRIES" ]]; then
  echo "ERROR: countries cannot be supplied in poll-only mode" >&2
  exit 2
fi

if [[ -z "$POLL_QUEUE" ]]; then
  COUNTRIES="${COUNTRIES:-ng}"
  IFS=',' read -r -a country_list <<< "$COUNTRIES"
  normalized_countries=""

  for country in "${country_list[@]}"; do
    case "$country" in
      ng|gh|ke|zm|tz|ug|za|int|br|ng1|ng2|ng3|ng4|ng5|ug2|int1) ;;
      *) echo "ERROR: unsupported country: $country" >&2; exit 2 ;;
    esac
    case ",${normalized_countries}," in
      *",${country},"*) ;;
      *) normalized_countries="${normalized_countries:+${normalized_countries},}${country}" ;;
    esac
  done

  [[ -n "$normalized_countries" ]] || { echo "ERROR: no countries supplied" >&2; exit 2; }
  COUNTRIES="$normalized_countries"
fi

JENKINS_URL="${JENKINS_URL:?JENKINS_URL env var required}"
JENKINS_URL="${JENKINS_URL%/}"
JENKINS_USER="${JENKINS_USER:?JENKINS_USER env var required}"
JENKINS_TOKEN="${JENKINS_TOKEN:?JENKINS_TOKEN env var required}"
AUTH="${JENKINS_USER}:${JENKINS_TOKEN}"

JOB_PATH="job/TW-FE/job/${REPO}/job/uat"
BUILD_URL="${JENKINS_URL}/${JOB_PATH}"
CURL_COMMON=(--silent --show-error --connect-timeout 10 --max-time 30 --user "$AUTH")

if [[ -n "$POLL_QUEUE" ]]; then
  case "$POLL_QUEUE" in
    "$JENKINS_URL"/queue/*) ;;
    *) echo "ERROR: queue URL is not from the configured Jenkins server" >&2; exit 2 ;;
  esac

  QUEUE_API="${POLL_QUEUE%/}/api/json"
  BUILD_NUMBER=""
  QUEUE_ERROR=""
  for ((attempt = 1; attempt <= 20; attempt++)); do
    if QUEUE_JSON=$(curl "${CURL_COMMON[@]}" --fail-with-body "$QUEUE_API" 2>&1); then
      QUEUE_ERROR=""
    else
      QUEUE_ERROR="${QUEUE_JSON%%$'\n'*}"
      QUEUE_JSON=""
    fi
    BUILD_NUMBER=$(printf '%s' "$QUEUE_JSON" | python3 -c '
import json, sys
try:
    executable = json.load(sys.stdin).get("executable")
    if executable:
        print(executable["number"])
except (ValueError, KeyError, TypeError):
    pass
' 2>/dev/null)
    [[ -z "$BUILD_NUMBER" ]] || break
    sleep 3
  done

  if [[ -z "$BUILD_NUMBER" ]]; then
    if [[ -n "$QUEUE_ERROR" ]]; then
      echo "ERROR: queue polling failed: $QUEUE_ERROR" >&2
    else
      echo "ERROR: queue timeout after 60 seconds" >&2
    fi
    exit 1
  fi

  echo "BUILD_NUMBER=${BUILD_NUMBER}"
  echo "BUILD_DETAIL_URL=${BUILD_URL}/${BUILD_NUMBER}/"

  BUILD_ERROR=""
  for ((attempt = 1; attempt <= 120; attempt++)); do
    if BUILD_JSON=$(curl "${CURL_COMMON[@]}" --fail-with-body "${BUILD_URL}/${BUILD_NUMBER}/api/json?tree=result,building" 2>&1); then
      BUILD_ERROR=""
    else
      BUILD_ERROR="${BUILD_JSON%%$'\n'*}"
      BUILD_JSON=""
    fi
    STATUS=$(printf '%s' "$BUILD_JSON" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    print("{}|{}".format(data.get("building", ""), data.get("result") or ""))
except (ValueError, TypeError):
    pass
' 2>/dev/null)
    BUILDING="${STATUS%%|*}"
    RESULT="${STATUS#*|}"

    if [[ "$BUILDING" == "False" && -n "$RESULT" ]]; then
      echo "BUILD_RESULT=${RESULT}"
      echo "BUILD_FINISHED"
      exit 0
    fi

    echo "POLL: build still running (${attempt}/120)"
    sleep 30
  done

  if [[ -n "$BUILD_ERROR" ]]; then
    echo "ERROR: build polling failed: $BUILD_ERROR" >&2
  else
    echo "ERROR: build timeout after 60 minutes" >&2
  fi
  exit 1
fi

CRUMB_JSON=$(curl "${CURL_COMMON[@]}" --fail-with-body "${JENKINS_URL}/crumbIssuer/api/json")
CRUMB_FIELD=$(printf '%s' "$CRUMB_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["crumbRequestField"])')
CRUMB_VALUE=$(printf '%s' "$CRUMB_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["crumb"])')

CURL_DATA=(
  --data-urlencode "countries=${COUNTRIES}"
  --data-urlencode "environment=uat"
  --data-urlencode "brand=sportybet"
  --data-urlencode "forceDeploy=false"
)
if [[ "$REPO" == "fe-web-mvc" ]]; then
  CURL_DATA+=(--data-urlencode "excludedCountries=int1,za1" --data-urlencode "storybook=false")
fi

RESPONSE=$(curl "${CURL_COMMON[@]}" \
  --header "${CRUMB_FIELD}:${CRUMB_VALUE}" \
  --request POST "${BUILD_URL}/buildWithParameters" \
  "${CURL_DATA[@]}" \
  --dump-header - --output /dev/null --write-out $'\nHTTP_CODE=%{http_code}')

QUEUE_URL=$(printf '%s' "$RESPONSE" | awk 'BEGIN { IGNORECASE=1 } /^location:/ { gsub("\\r", "", $2); print $2; exit }')
HTTP_CODE=$(printf '%s' "$RESPONSE" | awk -F= '/^HTTP_CODE=/ { print $2 }')

if [[ "$HTTP_CODE" != "201" || -z "$QUEUE_URL" ]]; then
  echo "ERROR: build trigger failed with HTTP ${HTTP_CODE:-unknown}" >&2
  exit 1
fi

echo "BUILD_TRIGGERED"
echo "REPO=${REPO}"
echo "COUNTRIES=${COUNTRIES}"
echo "QUEUE_URL=${QUEUE_URL}"
echo "CONSOLE_URL=${BUILD_URL}/lastBuild/console"
