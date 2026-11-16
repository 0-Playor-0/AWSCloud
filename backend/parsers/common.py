"""Shared OCR parsing helpers. OCR text is data: it is only ever parsed into four fields."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date


@dataclass(frozen=True)
class OcrLine:
    text: str
    confidence: float  # 0..1


@dataclass(frozen=True)
class FieldValue:
    value: str | None = None
    confidence: float = 0.0
    precision: str | None = None  # dob only: "day" | "year"


@dataclass
class Fields:
    name: FieldValue = field(default_factory=FieldValue)
    dob: FieldValue = field(default_factory=FieldValue)
    parent_name: FieldValue = field(default_factory=FieldValue)
    gender: FieldValue = field(default_factory=FieldValue)

    def empty(self) -> bool:
        return all(getattr(self, f).value is None for f in FIELD_NAMES)

    def fill(self, other: Fields) -> Fields:
        """Keep found values; take missing ones from `other`."""
        for f in FIELD_NAMES:
            if getattr(self, f).value is None:
                setattr(self, f, getattr(other, f))
        return self


FIELD_NAMES = ("name", "dob", "parent_name", "gender")

_MONTHS = {m: i for i, m in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], 1)}
_DMY = re.compile(r"(?<!\d)(\d{1,2})\s?[/\-.]\s?(\d{1,2})\s?[/\-.]\s?(\d{4})(?!\d)")
_YMD = re.compile(r"(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)")
_D_MON_Y = re.compile(r"(?<!\d)(\d{1,2})[\s\-/]*([A-Z]{3})[A-Z]*[\s\-/,]*(\d{4})(?!\d)")
_YEAR_OF_BIRTH = re.compile(r"\b(?:YEAR\s*OF\s*BIRTH|YOB)\b\W*(\d{4})(?!\d)")
_GENDER_WORD = re.compile(r"\b(MALE|FEMALE|TRANSGENDER)\b")
_GENDER_LABEL = re.compile(r"\b(?:GENDER|SEX)\b\W*([MFT])\b")
_LATIN_NAME = re.compile(r"^[A-Z][A-Z .']{1,79}$")
_NON_LATIN = re.compile(r"[^\x00-\x7f]+")
# Words that mark a label or document furniture, never part of a person's name.
_LABEL_WORD = re.compile(
    r"\b(?:DOB|DATE|BIRTH|YEAR|YOB|GENDER|SEX|NAME|FATHER|MOTHER|GUARDIAN|HUSBAND|GOVT|"
    r"GOVERNMENT|DEPARTMENT|INDIA|ACCOUNT|NUMBER|CARD|ISSUE|SIGNATURE|AUTHORITY|ADDRESS|"
    r"SURNAME|GIVEN|NATIONALITY|PLACE|EXPIRY|BANK|BRANCH|IFSC|BOARD|EXAMINATION|ROLL|SCHOOL|"
    r"CERTIFY|MARKS|SUBJECT|CUSTOMER|MEMBER|HOLDER|CANDIDATE)\b"
)

# Lines that look like names but are document furniture.
STOPWORDS = frozenset({
    "GOVERNMENT OF INDIA", "GOVT OF INDIA", "GOVT. OF INDIA", "INCOME TAX DEPARTMENT",
    "PERMANENT ACCOUNT NUMBER", "PERMANENT ACCOUNT NUMBER CARD", "REPUBLIC OF INDIA",
    "UNIQUE IDENTIFICATION AUTHORITY OF INDIA", "MALE", "FEMALE", "TRANSGENDER", "INDIA",
    "SIGNATURE", "PASSPORT", "AADHAAR", "MERA AADHAAR MERI PEHCHAN", "STATEMENT OF MARKS",
    "MARKS STATEMENT", "SECONDARY SCHOOL EXAMINATION", "PASSBOOK", "SAVINGS ACCOUNT",
})


def latin(text: str) -> str:
    """Uppercase and drop non-Latin script (bilingual labels), collapsing spaces."""
    return " ".join(_NON_LATIN.sub(" ", text).upper().replace("|", " ").split()).strip(" /")


def iso_date(y: int, m: int, d: int) -> str | None:
    try:
        return date(y, m, d).isoformat()
    except ValueError:
        return None


def find_date(text: str) -> tuple[str, str] | None:
    """Return (value, precision) for the first date in the text."""
    t = latin(text)
    candidates: list[tuple[int, int, int]] = []
    if m := _YMD.search(t):
        candidates.append((int(m[1]), int(m[2]), int(m[3])))
    if m := _DMY.search(t):
        candidates.append((int(m[3]), int(m[2]), int(m[1])))
    if (m := _D_MON_Y.search(t)) and m[2] in _MONTHS:
        candidates.append((int(m[3]), _MONTHS[m[2]], int(m[1])))
    for y, mo, d in candidates:
        if v := iso_date(y, mo, d):
            return v, "day"
    if m := _YEAR_OF_BIRTH.search(t):
        return m[1], "year"
    return None


def find_gender(text: str) -> str | None:
    t = latin(text)
    if m := _GENDER_WORD.search(t):
        return {"MALE": "M", "FEMALE": "F", "TRANSGENDER": "O"}[m[1]]
    if m := _GENDER_LABEL.search(t):
        return {"M": "M", "F": "F", "T": "O"}[m[1]]
    return None


def clean_name(text: str) -> str | None:
    """A plausible Latin-script name, or None."""
    t = latin(text).strip(" .:-'")
    t = re.sub(r"\s*\.\s*", ". ", t).strip()
    t = " ".join(t.split())
    if (
        not _LATIN_NAME.match(t)
        or t in STOPWORDS
        or _LABEL_WORD.search(t)
        or len(t.replace(".", "").strip()) < 2
    ):
        return None
    return t


@dataclass(frozen=True)
class Labels:
    name: re.Pattern[str]
    parent: re.Pattern[str]


GENERIC_LABELS = Labels(
    name=re.compile(
        r"^(?:(?:FULL|CANDIDATE'?S?|STUDENT'?S?|APPLICANT'?S?|MEMBER'?S?|CUSTOMER|"
        r"ACCOUNT\s*HOLDER'?S?|A/?C\s*HOLDER'?S?|HOLDER'?S?)\s*)?NAME(?:\s*OF\s*"
        r"(?:THE\s*)?(?:CANDIDATE|STUDENT|APPLICANT|MEMBER|ACCOUNT\s*HOLDER))?\b"
    ),
    parent=re.compile(
        r"^(?:(?:FATHER|MOTHER|GUARDIAN|PARENT)'?S?(?:\s*/\s*(?:HUSBAND|GUARDIAN|MOTHER)'?S?)?"
        r"(?:\s*NAME)?|S\s*/\s*O|D\s*/\s*O|SON\s+OF|DAUGHTER\s+OF)\b"
    ),
)
_SEPARATOR = re.compile(r"^[\s:;\-–.]+")


def _value_after(lines: list[OcrLine], i: int, label_end: int) -> tuple[str, float] | None:
    rest = _SEPARATOR.sub("", latin(lines[i].text)[label_end:])
    if rest:
        return rest, lines[i].confidence
    if i + 1 < len(lines):
        return lines[i + 1].text, lines[i + 1].confidence
    return None


def _parent_rank(label: str) -> int:
    """Prefer father (matches PAN), then guardian, then mother."""
    if label.startswith("MOTHER"):
        return 2
    if label.startswith(("GUARDIAN", "PARENT")):
        return 1
    return 0


def labelled_fields(lines: list[OcrLine], labels: Labels = GENERIC_LABELS) -> Fields:
    """Fields found next to labels ("Name: X", or "Name" with X on the next line)."""
    out = Fields()
    parent_rank = 99
    for i, line in enumerate(lines):
        t = latin(line.text)
        if m := labels.parent.match(t):
            found = _value_after(lines, i, m.end())
            rank = _parent_rank(m[0])
            if found and rank < parent_rank and (n := clean_name(found[0])):
                out.parent_name = FieldValue(n, found[1])
                parent_rank = rank
            continue
        if out.name.value is None and (m := labels.name.match(t)):
            found = _value_after(lines, i, m.end())
            if found and (n := clean_name(found[0])):
                out.name = FieldValue(n, found[1])
            continue
        if out.dob.value is None and (found_date := find_date(t)):
            out.dob = FieldValue(found_date[0], line.confidence, found_date[1])
        if out.gender.value is None and (g := find_gender(t)):
            out.gender = FieldValue(g, line.confidence)
    return out
