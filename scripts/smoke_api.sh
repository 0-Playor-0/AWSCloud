#!/usr/bin/env bash
# Curl every route and every reproducible error code against a deployed API.
#   scripts/smoke_api.sh https://<api-id>.execute-api.ap-south-1.amazonaws.com
# Prints status + body for each case (synthetic data only), then PASS/FAIL per case.
set -uo pipefail
API="${1:?usage: scripts/smoke_api.sh <ApiUrl>}"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
FAILS=0

check() { # name expected_status expected_code method path [curl args...]
  local name=$1 want=$2 code=$3 method=$4 path=$5; shift 5
  local status body ok=1
  status=$(curl -sS -o "$WORK/body" -w '%{http_code}' -X "$method" "$API$path" "$@")
  body=$(head -c 600 "$WORK/body")
  [[ "$status" == "$want" ]] || ok=0
  [[ -z "$code" ]] || grep -q "\"code\": *\"$code\"" "$WORK/body" || ok=0
  printf '%-28s %s %s\n    %s\n' "$name" "$status" "$([[ $ok == 1 ]] && echo PASS || echo FAIL)" "$body"
  [[ $ok == 1 ]] || FAILS=$((FAILS + 1))
}
J=(-H 'content-type: application/json')
COMPARE='{"purpose":"epf_claim","documents":[{"doc_type":"aadhaar","fields":{"name":"K RAVI","dob":"2007-03-14","parent_name":null,"gender":"M"}},{"doc_type":"passbook","fields":{"name":"RAVI KUMAR","dob":"2007-03-14","parent_name":null,"gender":"M"}}],"anchor":{"name":"aadhaar"}}'
OK_LINES='{"doc_type":"aadhaar","ocr_lines":["SAMPLE","Ravi Kumar K","DOB: 14/03/2007","MALE"]}'
ID_LINES='{"doc_type":"aadhaar","ocr_lines":["Ravi Kumar K","9999 9999 9999"]}'   # synthetic
BLANK_LINES='{"doc_type":"pan","ocr_lines":["~ | ..","--"]}'
BIG=$(python3 -c 'print("{\"doc_type\":\"pan\",\"ocr_lines\":[\"" + " " * 40000 + "\"]}")')

check health              200 ""                  GET  /v1/health
check stats               200 ""                  GET  /v1/stats
check compare             200 ""                  POST /v1/compare "${J[@]}" -d "$COMPARE"
check extract_ok          200 ""                  POST /v1/extract "${J[@]}" -d "$OK_LINES"
check id_number_detected  422 id_number_detected  POST /v1/extract "${J[@]}" -d "$ID_LINES"
check unreadable          422 unreadable          POST /v1/extract "${J[@]}" -d "$BLANK_LINES"
check image_rejected      400 invalid_request     POST /v1/extract "${J[@]}" -d '{"doc_type":"pan","image_b64":"/9j/4AAQ"}'
check request_too_large   413 request_too_large   POST /v1/extract "${J[@]}" -d "$BIG"
check invalid_request     400 invalid_request     POST /v1/compare "${J[@]}" -d '{"purpose":"visa","documents":[]}'
check wrong_content_type  400 invalid_request     POST /v1/compare -H 'content-type: text/plain' -d "$COMPARE"
check not_found           404 ""                  GET  /v1/nope
check cors_preflight      204 ""                  OPTIONS /v1/compare -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST'

echo "--- throttling burst (expect some 429s) ---"
for _ in $(seq 1 15); do curl -s -o /dev/null -w '%{http_code} ' "$API/v1/health" & done; wait; echo
echo "--- daily_cap_reached / extractor_failed: bedrock mode only (not built); covered by integration tests ---"
echo "FAILURES: $FAILS"
