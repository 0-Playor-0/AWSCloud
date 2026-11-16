"""Load and validate engine/rules.yaml."""

from __future__ import annotations

from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Any

import yaml

RULES_PATH = Path(__file__).with_name("rules.yaml")
VERIFIED_LEVELS = frozenset({"true", "secondary", "unverified"})
EFFECT_TYPES = frozenset({"caution_on_change", "raise_severity", "annotate"})


@dataclass(frozen=True)
class Rule:
    id: str
    applies_to: tuple[str, ...]
    statement: str
    effect: dict[str, Any]
    source_url: str | None
    verified: str

    @property
    def has_source(self) -> bool:
        return self.verified in {"true", "secondary"} and bool(self.source_url)


def _validate(rule: Rule) -> None:
    if rule.verified not in VERIFIED_LEVELS:
        raise ValueError(f"{rule.id}: bad verified value")
    if rule.effect.get("type") not in EFFECT_TYPES:
        raise ValueError(f"{rule.id}: bad effect type")
    if rule.effect["type"] == "raise_severity" and not rule.has_source:
        raise ValueError(f"{rule.id}: only sourced rules may raise severity")
    if not rule.has_source and " may " not in f" {rule.statement} ":
        raise ValueError(f"{rule.id}: unverified rules must be worded 'may'")


def load_rules(path: Path = RULES_PATH) -> dict[str, Rule]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    rules: dict[str, Rule] = {}
    for item in raw["rules"]:
        rule = Rule(
            id=item["id"],
            applies_to=tuple(item["applies_to"]),
            statement=" ".join(item["statement"].split()),
            effect=dict(item["effect"]),
            source_url=item.get("source_url"),
            verified=str(item["verified"]).lower(),
        )
        _validate(rule)
        rules[rule.id] = rule
    return rules


@cache
def default_rules() -> dict[str, Rule]:
    return load_rules()
