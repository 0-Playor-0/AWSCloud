"""DynamoDB counters against botocore Stubber (no network)."""

from datetime import UTC, datetime

import boto3
import pytest
from botocore.stub import ANY, Stubber

from backend.counters import DynamoCounters

NOW = datetime(2026, 11, 16, 20, 0, tzinfo=UTC)  # 01:30 IST on 17 Nov


@pytest.fixture
def ddb():
    client = boto3.client("dynamodb", region_name="ap-south-1",
                          aws_access_key_id="x", aws_secret_access_key="x")
    with Stubber(client) as stub:
        yield client, stub
        stub.assert_no_pending_responses()


def test_consume_extraction_uses_ist_day_and_condition(ddb) -> None:
    client, stub = ddb
    stub.add_response("update_item", {}, {
        "TableName": "nc_counters",
        "Key": {"pk": {"S": "extract#2026-11-17"}},
        "UpdateExpression": "ADD n :one SET expires_at = if_not_exists(expires_at, :ttl)",
        "ConditionExpression": "attribute_not_exists(n) OR n < :cap",
        "ExpressionAttributeValues": {":one": {"N": "1"}, ":cap": {"N": "300"}, ":ttl": ANY},
    })
    assert DynamoCounters(client, "nc_counters").consume_extraction(300, now=NOW) is True


def test_consume_extraction_cap_reached(ddb) -> None:
    client, stub = ddb
    stub.add_client_error("update_item", "ConditionalCheckFailedException")
    assert DynamoCounters(client, "nc_counters").consume_extraction(300, now=NOW) is False


def test_cap_zero_never_calls_dynamodb(ddb) -> None:
    client, _ = ddb
    assert DynamoCounters(client, "nc_counters").consume_extraction(0) is False


def test_record_check_and_stats(ddb) -> None:
    client, stub = ddb
    stub.add_response("update_item", {}, {
        "TableName": "nc_counters", "Key": {"pk": {"S": "stats"}},
        "UpdateExpression": "ADD checks :one, checks_with_mismatch :m",
        "ExpressionAttributeValues": {":one": {"N": "1"}, ":m": {"N": "1"}},
    })
    stub.add_response("get_item", {"Item": {"pk": {"S": "stats"}, "checks": {"N": "7"},
                                            "checks_with_mismatch": {"N": "3"}}})
    stub.add_response("get_item", {})
    c = DynamoCounters(client, "nc_counters")
    c.record_check(True)
    assert c.stats() == {"checks": 7, "checks_with_mismatch": 3}
    assert c.stats() == {"checks": 0, "checks_with_mismatch": 0}
