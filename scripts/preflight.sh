#!/usr/bin/env bash
# Phase 0 AWS checks. Run on your machine from the repo root:
#   scripts/preflight.sh you@example.com            # checks + creates the budget
#   scripts/preflight.sh                            # checks only
# Output is safe to paste back: the account ID is masked, nothing secret is printed.
set -uo pipefail
source "$(dirname "$0")/region.sh"; export AWS_PAGER=""
EMAIL="${1:-}"
mask() { sed -E 's/[0-9]{12}/<account>/g'; }
exec > >(mask) 2>&1  # mask the account ID in errors too
section() { printf '\n=== %s ===\n' "$1"; }
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT  # budget JSON only

section "Tool versions"
for t in aws sam python3 node git make; do printf '%s: ' "$t"; ($t --version 2>&1 || echo missing) | head -1; done

section "Identity and region"
aws sts get-caller-identity --query '{Account:Account,Arn:Arn}' --output json | mask
echo "region: $(aws configure get region || echo "$AWS_REGION")"
if aws sts get-caller-identity --query Arn --output text | grep -q ':root'; then
  echo "WARNING: these are ROOT credentials. Use an IAM user or SSO profile instead."
fi

section "Lambda concurrency (reserved concurrency needs headroom)"
aws lambda get-account-settings --query 'AccountLimit.{ConcurrentExecutions:ConcurrentExecutions,Unreserved:UnreservedConcurrentExecutions}' --output json

section "Bedrock (information only; stays off): models with image input in $REGION"
aws bedrock list-foundation-models --by-inference-type ON_DEMAND \
  --query 'modelSummaries[?contains(inputModalities, `IMAGE`)].[modelId,modelLifecycle.status]' \
  --output text || echo "BEDROCK LIST: FAILED"

section "Bedrock (information only): inference profiles visible in $REGION"
aws bedrock list-inference-profiles --query 'inferenceProfileSummaries[].[inferenceProfileId,status]' \
  --output text || echo "PROFILES: FAILED"

section "Bedrock: model invocation logging (must be empty / disabled)"
aws bedrock get-model-invocation-logging-configuration --output json || true

section "Bedrock: on-demand quotas (requests/tokens per minute)"
aws service-quotas list-service-quotas --service-code bedrock \
  --query 'Quotas[?contains(QuotaName, `On-demand`) && (contains(QuotaName, `requests per minute`) || contains(QuotaName, `tokens per minute`))].[QuotaName,Value]' \
  --output text | sort | head -60 || echo "QUOTAS: FAILED"

section "Budget (alerts at \$10, \$25, \$50 actual)"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if aws budgets describe-budget --account-id "$ACCOUNT" --budget-name namma-check-monthly >/dev/null 2>&1; then
  echo "budget namma-check-monthly already exists"
  echo "notifications (type threshold comparison threshold-type):"
  aws budgets describe-budget --account-id "$ACCOUNT" --budget-name namma-check-monthly \
    --query 'Budget.NotificationsWithSubscribers[].Notifications[].[NotificationType,Threshold,ComparisonOperator,ThresholdType]' \
    --output text
elif [[ -z "$EMAIL" ]]; then
  echo "skipped: pass your alert email as the first argument to create it"
else
  cat > "$WORK/budget.json" <<'EOF'
{"BudgetName":"namma-check-monthly","BudgetType":"COST","TimeUnit":"MONTHLY",
 "BudgetLimit":{"Amount":"50","Unit":"USD"}}
EOF
  NOTIFS=""
  for amt in 10 25 50; do
    NOTIFS+="{\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":$amt,\"ThresholdType\":\"ABSOLUTE_VALUE\"},\"Subscribers\":[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"$EMAIL\"}]},"
  done
  echo "[${NOTIFS%,}]" > "$WORK/notifs.json"
  aws budgets create-budget --account-id "$ACCOUNT" --budget "file://$WORK/budget.json" \
    --notifications-with-subscribers "file://$WORK/notifs.json" \
    && echo "BUDGET: created" || echo "BUDGET: FAILED"
fi
aws budgets describe-budgets --account-id "$ACCOUNT" \
  --query 'Budgets[].[BudgetName,BudgetLimit.Amount,CalculatedSpend.ActualSpend.Amount]' --output text | mask

section "Done"
