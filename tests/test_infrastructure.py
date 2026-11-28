"""Infrastructure regression tests for the SAM template."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent.parent


class _CfnLoader(yaml.SafeLoader):
    pass


def _construct_cfn_tag(loader: _CfnLoader, suffix: str, node: yaml.Node) -> dict[str, Any]:
    key = "Ref" if suffix == "Ref" else f"Fn::{suffix}"
    if isinstance(node, yaml.ScalarNode):
        value: Any = loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node, deep=True)
    else:
        value = loader.construct_mapping(node, deep=True)
    return {key: value}


_CfnLoader.add_multi_constructor("!", _construct_cfn_tag)
_TEMPLATE = yaml.load((ROOT / "template.yaml").read_text(), Loader=_CfnLoader)
_RESOURCES = _TEMPLATE["Resources"]


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else [value]


def test_dashboard_uses_only_existing_low_cardinality_metrics() -> None:
    body = _RESOURCES["OperationsDashboard"]["Properties"]["DashboardBody"]["Fn::Sub"]
    rendered = re.sub(r"\$\{[^}]+\}", "test-resource", body)
    widgets = json.loads(rendered)["widgets"]
    metric_widgets = [w for w in widgets if w["type"] == "metric"]

    metrics = {tuple(row[:2]) for w in metric_widgets for row in w["properties"]["metrics"]}
    assert metrics == {
        ("AWS/ApiGateway", "Count"),
        ("AWS/ApiGateway", "4xx"),
        ("AWS/ApiGateway", "5xx"),
        ("AWS/ApiGateway", "Latency"),
        ("AWS/Lambda", "Invocations"),
        ("AWS/Lambda", "Errors"),
        ("AWS/Lambda", "Duration"),
        ("AWS/Lambda", "Throttles"),
        ("AWS/Lambda", "ConcurrentExecutions"),
        ("AWS/DynamoDB", "ConsumedReadCapacityUnits"),
        ("AWS/DynamoDB", "ConsumedWriteCapacityUnits"),
    }

    for widget in metric_widgets:
        assert widget["properties"]["region"] == "test-resource"
        for row in widget["properties"]["metrics"]:
            dimensions = row[2:]
            assert not {"Method", "Resource"}.intersection(dimensions)


def test_alarm_thresholds_remain_conservative() -> None:
    alarms = {
        name: resource["Properties"]
        for name, resource in _RESOURCES.items()
        if resource["Type"] == "AWS::CloudWatch::Alarm"
    }
    assert alarms["LambdaErrorsAlarm"]["Threshold"] == 3
    assert alarms["LambdaThrottlesAlarm"]["Threshold"] == 20
    assert alarms["LambdaHighDurationAlarm"]["MetricName"] == "Duration"
    assert alarms["LambdaHighDurationAlarm"]["Statistic"] == "Maximum"
    assert alarms["LambdaHighDurationAlarm"]["Threshold"] == 15000
    assert alarms["LambdaHighDurationAlarm"]["Period"] == 300
    assert alarms["Api5xxRateAlarm"]["Threshold"] == 0.2
    assert alarms["CounterUnavailableAlarm"]["Threshold"] == 1


def test_lambda_role_is_scoped_to_the_function_resources() -> None:
    function = _RESOURCES["ApiFunction"]["Properties"]
    assert function["Role"] == {"Fn::GetAtt": "ApiFunctionRole.Arn"}
    assert "Policies" not in function

    role = _RESOURCES["ApiFunctionRole"]["Properties"]
    trust = role["AssumeRolePolicyDocument"]["Statement"][0]
    assert trust["Principal"] == {"Service": "lambda.amazonaws.com"}
    assert trust["Action"] == "sts:AssumeRole"

    statements = role["Policies"][0]["PolicyDocument"]["Statement"]
    actions = {action for statement in statements for action in _as_list(statement["Action"])}
    assert actions == {
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
    }
    assert all(action != "*" for action in actions)
    assert all(statement["Resource"] != "*" for statement in statements)

    resources = {json.dumps(statement["Resource"], sort_keys=True) for statement in statements}
    assert '{"Fn::GetAtt": "CountersTable.Arn"}' in resources
    assert (
        '{"Fn::Sub": "arn:${AWS::Partition}:logs:${AWS::Region}:'
        '${AWS::AccountId}:log-group:${FunctionLogs}"}'
        in resources
    )
    assert (
        '{"Fn::Sub": "arn:${AWS::Partition}:logs:${AWS::Region}:'
        '${AWS::AccountId}:log-group:${FunctionLogs}:*"}'
        in resources
    )


def test_existing_cost_and_concurrency_guards_remain() -> None:
    parameters = _TEMPLATE["Parameters"]
    assert parameters["ThrottleRate"]["Default"] == 10
    assert parameters["ThrottleBurst"]["Default"] == 20
    assert parameters["ReservedConcurrency"]["Default"] == 20

    route_settings = _RESOURCES["HttpApi"]["Properties"]["DefaultRouteSettings"]
    assert route_settings["ThrottlingRateLimit"] == {"Ref": "ThrottleRate"}
    assert route_settings["ThrottlingBurstLimit"] == {"Ref": "ThrottleBurst"}

    function = _RESOURCES["ApiFunction"]["Properties"]
    assert function["ReservedConcurrentExecutions"] == {
        "Fn::If": ["ReserveConcurrency", {"Ref": "ReservedConcurrency"}, {"Ref": "AWS::NoValue"}]
    }
    assert _RESOURCES["CountersTable"]["Properties"]["BillingMode"] == "PAY_PER_REQUEST"

    access_block = _RESOURCES["SiteBucket"]["Properties"]["PublicAccessBlockConfiguration"]
    assert access_block == {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True,
    }
