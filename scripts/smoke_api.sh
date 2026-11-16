#!/usr/bin/env bash
# Curl every route and every reproducible error code against a deployed API.
#   scripts/smoke_api.sh https://<api-id>.execute-api.ap-south-1.amazonaws.com
# Prints status + body for each case (synthetic data only), then PASS/FAIL per case.
set -uo pipefail
API="${1:?usage: scripts/smoke_api.sh <ApiUrl>}"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
python3 scripts/make_images.py "$WORK"
FAILS=0

check() { # name expected_status expected_code method path [curl args...]
  local name=$1 want=$2 code=$3 method=$4 path=$5; shift 5
  local out status body
  out=$(curl -sS -o "$WORK/body" -w '%{http_code}' -X "$method" "$API$path" "$@")
  status=$out; body=$(head -c 600 "$WORK/body")
  local ok=1
  [[ "$status" == "$want" ]] || ok=0
  [[ -z "$code" ]] || grep -q "\"code\": *\"$code\"" "$WORK/body" || ok=0
  printf '%-28s %s %s\n    %s\n' "$name" "$status" "$([[ $ok == 1 ]] && echo PASS || echo FAIL)" "$body"
  [[ $ok == 1 ]] || FAILS=$((FAILS + 1))
}
J=(-H 'content-type: application/json')
COMPARE='{"purpose":"epf_claim","documents":[{"doc_type":"aadhaar","fields":{"name":"K RAVI","dob":"2007-03-14","parent_name":null,"gender":"M"}},{"doc_type":"passbook","fields":{"name":"RAVI KUMAR","dob":"2007-03-14","parent_name":null,"gender":"M"}}],"anchor":{"name":"aadhaar"}}'

check health              200 ""                  GET  /v1/health
check stats               200 ""                  GET  /v1/stats
check compare             200 ""                  POST /v1/compare "${J[@]}" -d "$COMPARE"
check extract_ok          200 ""                  POST /v1/extract "${J[@]}" -d "@$WORK/extract_text.json"
check invalid_image       400 invalid_image       POST /v1/extract "${J[@]}" -d "@$WORK/extract_png.json"
check image_too_large     413 image_too_large     POST /v1/extract "${J[@]}" -d "@$WORK/extract_too_wide.json"
check id_number_detected  422 id_number_detected  POST /v1/extract "${J[@]}" -d "@$WORK/extract_id_number.json"
check unreadable          422 unreadable          POST /v1/extract "${J[@]}" -d "@$WORK/extract_blank.json"
check invalid_request     400 invalid_request     POST /v1/compare "${J[@]}" -d '{"purpose":"visa","documents":[]}'
check wrong_content_type  400 invalid_request     POST /v1/compare -H 'content-type: text/plain' -d "$COMPARE"
check not_found           404 ""                  GET  /v1/nope
check cors_preflight      204 ""                  OPTIONS /v1/compare -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'

echo "--- throttling burst (expect some 429s) ---"
for i in $(seq 1 15); do curl -s -o /dev/null -w '%{http_code} ' "$API/v1/health" & done; wait; echo
echo "--- daily_cap_reached: redeploy with ExtractDailyCap=0, then rerun 'extract_ok' (expect 429) ---"
echo "--- extractor_failed (502): covered by integration tests; not reproducible safely on live AWS ---"
echo "FAILURES: $FAILS"
