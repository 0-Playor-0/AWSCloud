"""Name normalisation and pairwise classification for Indian naming conventions."""

from __future__ import annotations

import re
from collections import Counter

HONORIFICS = frozenset({"MR", "MRS", "MS", "SHRI", "SMT", "KUMARI", "DR"})

# Ordered: the first kind that applies wins (HANDOFF.md section 3, "Engine behaviour").
NAME_KINDS = (
    "exact",
    "format_only",
    "token_order",
    "initials_vs_expanded",
    "missing_token",
    "spelling_variant",
    "different",
)

_NON_LETTER = re.compile(r"[^A-Z\s]")
_SPACES = re.compile(r"\s+")


def normalize(value: str) -> list[str]:
    """Uppercase, turn punctuation into spaces, collapse spaces, drop leading honorifics.

    Honorifics are stripped only from the front, so a middle name such as KUMARI in
    "ANITA KUMARI SINGH" is kept.
    """
    text = _NON_LETTER.sub(" ", value.upper())
    tokens = _SPACES.sub(" ", text).strip().split(" ") if text.strip() else []
    while len(tokens) > 1 and tokens[0] in HONORIFICS:
        tokens = tokens[1:]
    return tokens


def is_blank(value: str | None) -> bool:
    return value is None or not normalize(value)


def _tokens_match(a: str, b: str) -> bool:
    """Equal tokens, or a single-letter initial matching the other token's first letter."""
    if a == b:
        return True
    if len(a) == 1 and b.startswith(a):
        return True
    return len(b) == 1 and a.startswith(b)


def _max_matching(small: list[str], large: list[str]) -> int:
    """Size of the largest one-to-one matching of tokens (Kuhn's augmenting paths)."""
    owner: list[int | None] = [None] * len(large)

    def augment(i: int, seen: list[bool]) -> bool:
        for j, token in enumerate(large):
            if seen[j] or not _tokens_match(small[i], token):
                continue
            seen[j] = True
            current = owner[j]
            if current is None or augment(current, seen):
                owner[j] = i
                return True
        return False

    return sum(augment(i, [False] * len(large)) for i in range(len(small)))


def levenshtein(a: str, b: str) -> int:
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        current = [i]
        for j, cb in enumerate(b, start=1):
            current.append(min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb)))
        previous = current
    return previous[-1]


def _single_spelling_variant(a: list[str], b: list[str]) -> bool:
    """Same tokens except one pair within edit distance 2 (shorter token at least 3 letters)."""
    if len(a) != len(b):
        return False
    only_a = list((Counter(a) - Counter(b)).elements())
    only_b = list((Counter(b) - Counter(a)).elements())
    if len(only_a) != 1 or len(only_b) != 1:
        return False
    x, y = only_a[0], only_b[0]
    return min(len(x), len(y)) >= 3 and levenshtein(x, y) <= 2


# Architect-approved equivalences, applied in this order.
_TRANSLIT = (
    ("KSH", "X"),
    ("SH", "S"),
    ("PH", "F"),
    ("TH", "T"),
    ("DH", "D"),
    ("W", "V"),
    ("EE", "I"),
    ("OO", "U"),
    ("AA", "A"),
)
_DOUBLE_CONSONANT = re.compile(r"([B-DF-HJ-NP-TV-Z])\1+")


def transliterate(token: str) -> str:
    """Fold common romanisation variants. Used only to downgrade `different`."""
    for old, new in _TRANSLIT:
        token = token.replace(old, new)
    token = _DOUBLE_CONSONANT.sub(r"\1", token)
    if len(token) > 1 and token.endswith("Y"):
        token = token[:-1] + "I"
    return token


def _transliteration_variant(a: list[str], b: list[str]) -> bool:
    return Counter(map(transliterate, a)) == Counter(map(transliterate, b))


def classify(a: str, b: str) -> str:
    """Return the name finding kind for two non-blank raw values. Symmetric in a and b."""
    if _SPACES.sub(" ", a.strip()) == _SPACES.sub(" ", b.strip()):
        return "exact"
    ta, tb = normalize(a), normalize(b)
    if "".join(ta) == "".join(tb):
        return "format_only"
    if Counter(ta) == Counter(tb):
        return "token_order"
    small, large = (ta, tb) if len(ta) <= len(tb) else (tb, ta)
    fully_matched = _max_matching(small, large) == len(small)
    if fully_matched and len(small) == len(large):
        return "initials_vs_expanded"
    if fully_matched:
        return "missing_token"
    if _single_spelling_variant(ta, tb) or _transliteration_variant(ta, tb):
        return "spelling_variant"
    return "different"
