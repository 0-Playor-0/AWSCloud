"""DynamoDB counters and Textract extractor against botocore Stubber (no network)."""

from datetime import UTC, datetime

import boto3
import pytest
from botocore.stub import ANY, Stubber

from backend.counters import DynamoCounters
from backend.extractors import ExtractorError, ExtractorThrottled
from backend.extractors.textract import TextractExtractor

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


@pytest.fixture
def textract():
    client = boto3.client("textract", region_name="ap-south-1",
                          aws_access_key_id="x", aws_secret_access_key="x")
    with Stubber(client) as stub:
        yield TextractExtractor(client), stub


def test_textract_lines_parsed(textract) -> None:
    ex, stub = textract
    stub.add_response("detect_document_text", {"Blocks": [
        {"BlockType": "PAGE"},
        {"BlockType": "LINE", "Text": "Ravi Kumar", "Confidence": 97.2},
        {"BlockType": "WORD", "Text": "Ravi", "Confidence": 97.2},
        {"BlockType": "LINE", "Text": "DOB: 14/03/2007", "Confidence": 91.0},
    ]}, {"Document": {"Bytes": b"img"}})
    result = ex.extract("aadhaar", b"img")
    assert result.fields.name.value == "RAVI KUMAR" and result.fields.name.confidence == 0.97
    assert result.fields.dob.value == "2007-03-14"
    assert result.raw_text == "Ravi Kumar\nDOB: 14/03/2007"


@pytest.mark.parametrize(
    "code,raises",
    [("ThrottlingException", ExtractorThrottled),
     ("ProvisionedThroughputExceededException", ExtractorThrottled),
     ("AccessDeniedException", ExtractorError),
     ("InternalServerError", ExtractorError)],
)
def test_textract_errors(textract, code: str, raises: type[Exception]) -> None:
    ex, stub = textract
    stub.add_client_error("detect_document_text", code)
    with pytest.raises(raises):
        ex.extract("pan", b"img")


@pytest.mark.parametrize("code", ["BadDocumentException", "UnsupportedDocumentException",
                                  "InvalidParameterException"])
def test_textract_unreadable_documents_return_empty(textract, code: str) -> None:
    ex, stub = textract
    stub.add_client_error("detect_document_text", code)
    assert ex.extract("pan", b"img").fields.empty()
