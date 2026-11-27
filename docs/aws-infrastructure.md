# AWS infrastructure and operations

Namma Check runs as one SAM stack, `namma-check`, in `ap-southeast-2` (Sydney). The region is
configured once in `samconfig.toml`; the template rejects a deployment to another region.

## Architecture and resources

```text
Browser -> CloudFront -> private S3 site
Browser -> API Gateway HTTP API -> Lambda -> DynamoDB counter table
                                  |-> CloudWatch Logs
                                  |-> CloudWatch metrics, dashboard and alarms
```

| Resource | Purpose | Important controls |
|---|---|---|
| CloudFront distribution | Static-site delivery | OAC to private S3, HTTPS redirect, security headers, PriceClass_200 |
| S3 site bucket | Built frontend only | Public access blocked, SSE-S3, ownership enforced, HTTPS-only deny |
| HTTP API | `/v1/extract`, `/v1/compare`, `/v1/health`, `/v1/stats` | 10 requests/s, burst 20, CORS restricted to the CloudFront origin |
| Lambda | Parsing, ID guard and comparison | Python 3.14, 512 MB, 20 s timeout, reserved concurrency 10, 14-day logs |
| DynamoDB `nc_counters` | Anonymous aggregate counters | PAY_PER_REQUEST, TTL, no document or field data |
| IAM execution role | Lambda service access | Only its log group and `nc_counters`; no wildcard resources or service-wide actions |
| SNS topic + alarms | Operational notification | Reuses the existing deploy-time `AlarmEmail` parameter |
| CloudWatch dashboard | Operational overview | Standard service metrics only; no custom metrics or user data |

## Operations dashboard

The stack creates `<stack-name>-operations` and exports its name as `OperationsDashboardName`.
It is divided into API Gateway, Lambda and DynamoDB sections and shows:

- API request count, 4xx count, 5xx count and average latency, filtered by API ID and `$default`
  stage (not route-level detailed metrics).
- Lambda invocations, errors, average duration, throttles and maximum concurrent executions,
  filtered by function name (not version, to avoid high-cardinality series).
- DynamoDB consumed read and write capacity units, filtered by table name.

The dashboard contains no request body, OCR text, document field, user identifier or other
sensitive data.

## Alarms

All alarms use five-minute periods and treat missing data as not breaching. When `AlarmEmail` is
non-empty, every alarm publishes to the existing SNS topic.

| Alarm | Condition | Why this threshold |
|---|---|---|
| Lambda errors | 3 or more in 5 minutes | Allows isolated failures without paging on one request |
| Lambda throttles | 20 or more in 5 minutes | Indicates sustained pressure against concurrency 10 rather than a brief burst |
| Lambda excessive duration | Maximum 15,000 ms or more | 75% of the 20-second timeout; catches a nearly stuck request |
| API 5xx rate | More than 20%, with at least 10 requests | Avoids alarming on one error in low traffic; separates server failures from client 4xx |
| Counter-store failure | 1 or more in 5 minutes | Counters are best effort, but the future metered-extraction cap would fail closed |

The API 429 threshold and Lambda concurrency limit are deliberate load-shedding controls, not
incidents by themselves. The client retries a busy response once. Burst 20 is above concurrency 10,
so a burst beyond 20 can surface as Lambda 503s rather than API 429s; this is documented rather than
silently changing the agreed limits.

## IAM and data protection

The Lambda role is defined in `template.yaml` and trusts only `lambda.amazonaws.com`. Its policy
allows `logs:CreateLogGroup`, `logs:CreateLogStream` and `logs:PutLogEvents` only on the managed
function log group, plus `dynamodb:GetItem` and `dynamodb:UpdateItem` only on `nc_counters`.
The Lambda has no S3, Bedrock, Textract, KMS, Secrets Manager, IAM or cross-account access.

The S3 bucket grants read access only to CloudFront and through Origin Access Control. Public
policies and public ACLs are blocked. The API is intentionally public for the competition demo;
CORS, request validation, throttling and the 20-second Lambda timeout bound exposure. CloudWatch
and API access logs contain metadata only and expire after 14 days.

The deployment IAM user is outside this stack. It was previously reported as using
`AdministratorAccess`; replace it with a scoped deploy policy where the account owner can do so.
No IAM user, access key, secret or credential belongs in this repository.

## Cost controls and visibility

- API Gateway: 10 requests/s, burst 20.
- Lambda: reserved concurrency 10, 512 MB, 20-second timeout.
- DynamoDB: PAY_PER_REQUEST; storage and request consumption appear on the dashboard.
- CloudFront caches versioned assets; the site has no paid per-request AI integration.
- CloudWatch logs: 14-day retention.
- One custom dashboard and one additional standard-resolution alarm. The dashboard uses no custom
  metrics, Logs Insights queries or external widgets. Current AWS pricing lists three custom
  dashboards in the Free Tier; eligibility and regional paid rates should be rechecked if the
  account leaves Free Tier.
- `namma-check-monthly` is a $50 monthly budget with actual-spend email notifications at $10, $25
  and $50. `scripts/preflight.sh` creates it when absent and now prints its notification settings.
  The budget alerts but does not automatically stop resources.

## Deployment runbook

1. Review the diff and run `sam validate --lint` plus `cfn-lint template.yaml`.
2. Build with `sam build`.
3. Deploy with `sam deploy --parameter-overrides GitSha=$(git rev-parse --short HEAD) AlarmEmail=<email>`.
   On an existing stack, explicitly pass any changed `ReservedConcurrency`, `ThrottleRate` or
   `ThrottleBurst`; SAM retains previous parameter values.
4. Confirm the SNS subscription email from AWS. Alarms still exist without it, but notification
   delivery is not active until confirmation.
5. Open the dashboard named by the `OperationsDashboardName` stack output and run
   `scripts/smoke_api.sh <ApiUrl> <SiteUrl>`.

Do not delete or replace the existing stack as part of a routine deployment. CloudFormation rolls
back a failed update, and dashboard and alarm updates do not interrupt API routing. The execution
role keeps the same logical ID and ARN while its permissions are updated in place; run the smoke
test immediately after that update. A deliberate rollback of the execution-role change also
requires restoring the prior role policy.

## Verified metric sources

- API Gateway HTTP API metrics: <https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-metrics.html>
- Lambda metrics: <https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics-types.html>
- DynamoDB metrics: <https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html>
- CloudWatch pricing: <https://aws.amazon.com/cloudwatch/pricing/>
