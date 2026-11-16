"""The engine must stay pure: no AWS SDK, no network, no file writes."""

import ast
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2] / "engine"
FORBIDDEN = {"boto3", "botocore", "socket", "urllib", "http", "requests", "subprocess"}


def test_engine_imports_are_pure() -> None:
    for path in ENGINE.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                roots = {a.name.split(".")[0] for a in node.names}
            elif isinstance(node, ast.ImportFrom) and node.level == 0:
                roots = {(node.module or "").split(".")[0]}
            else:
                continue
            assert not roots & FORBIDDEN, f"{path.name} imports {roots & FORBIDDEN}"
