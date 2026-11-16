"""Anonymous counters and the daily extraction cap in DynamoDB. No PII is ever written."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone
from typing import Any, Protocol

IST = timezone(timedelta(hours=5, minutes=30))
STATS_KEY = "stats"
DAILY_TTL = timedelta(days=3)


class CounterStore(Protocol):
    def consume_extraction(self, cap: int) -> bool: ...
    def record_check(self, mismatch: bool) -> None: ...
    def stats(self) -> dict[str, int]: ...


def _today_key(now: datetime) -> str:
    return f"extract#{now.astimezone(IST).date().isoformat()}"


class DynamoCounters:
    """Items: {pk: "extract#YYYY-MM-DD", n, expires_at} and {pk: "stats", checks, ...}."""

    def __init__(self, client: Any, table: str) -> None:
        self._client = client
        self._table = table

    def consume_extraction(self, cap: int, now: datetime | None = None) -> bool:
        """Atomically add one to today's count if it is below cap. False when the cap is hit."""
        if cap <= 0:
            return False
        now = now or datetime.now(UTC)
        try:
            self._client.update_item(
                TableName=self._table,
                Key={"pk": {"S": _today_key(now)}},
                UpdateExpression="ADD n :one SET expires_at = if_not_exists(expires_at, :ttl)",
                ConditionExpression="attribute_not_exists(n) OR n < :cap",
                ExpressionAttributeValues={
                    ":one": {"N": "1"},
                    ":cap": {"N": str(cap)},
                    ":ttl": {"N": str(int((now + DAILY_TTL).timestamp()))},
                },
            )
        except self._client.exceptions.ConditionalCheckFailedException:
            return False
        return True

    def record_check(self, mismatch: bool) -> None:
        self._client.update_item(
            TableName=self._table,
            Key={"pk": {"S": STATS_KEY}},
            UpdateExpression="ADD checks :one, checks_with_mismatch :m",
            ExpressionAttributeValues={":one": {"N": "1"}, ":m": {"N": "1" if mismatch else "0"}},
        )

    def stats(self) -> dict[str, int]:
        item = self._client.get_item(
            TableName=self._table, Key={"pk": {"S": STATS_KEY}}, ConsistentRead=False
        ).get("Item", {})
        return {
            "checks": int(item.get("checks", {}).get("N", "0")),
            "checks_with_mismatch": int(item.get("checks_with_mismatch", {}).get("N", "0")),
        }
