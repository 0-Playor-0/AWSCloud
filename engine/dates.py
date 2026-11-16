"""Date-of-birth parsing and pairwise classification."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

DOB_KINDS = ("exact", "year_only", "day_month_swapped", "off_by_small", "different")

_FULL = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_YEAR = re.compile(r"^(\d{4})$")


@dataclass(frozen=True)
class Dob:
    year: int
    month: int | None = None
    day: int | None = None

    @property
    def year_only(self) -> bool:
        return self.month is None


def parse(value: str) -> Dob:
    """Parse "YYYY-MM-DD" or "YYYY". Raises ValueError for anything else or impossible dates."""
    text = value.strip()
    if m := _FULL.match(text):
        y, mo, d = (int(g) for g in m.groups())
        date(y, mo, d)  # validates the calendar date
        return Dob(y, mo, d)
    if m := _YEAR.match(text):
        return Dob(int(m.group(1)))
    raise ValueError("dob must be YYYY-MM-DD or YYYY")


def classify(a: str, b: str) -> str:
    """Return the DOB finding kind for two non-blank values. Symmetric in a and b."""
    da, db = parse(a), parse(b)
    if da == db:
        return "exact"
    if da.year_only or db.year_only:
        return "year_only" if da.year == db.year else "different"
    if da.year == db.year and da.day == db.month and da.month == db.day:
        return "day_month_swapped"
    differing = (da.year != db.year) + (da.month != db.month) + (da.day != db.day)
    return "off_by_small" if differing == 1 else "different"
