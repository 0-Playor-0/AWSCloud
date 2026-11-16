"""Plain-English text for engine output. Kept in one place so it can be translated later."""

DISCLAIMER = "Self-check only. Not legal advice. Authorities decide."

DOC_LABELS = {
    "aadhaar": "Aadhaar",
    "pan": "PAN card",
    "marksheet10": "Class 10 marksheet",
    "passport": "passport",
    "passbook": "bank passbook",
    "other": "other document",
}

FIELD_LABELS = {
    "name": "name",
    "dob": "date of birth",
    "parent_name": "parent or guardian name",
    "gender": "gender",
}

EXPLANATIONS = {
    "format_only": "The {field} differs only in capital letters, dots or spacing.",
    "token_order": "The same words appear in the {field}, but in a different order.",
    "initials_vs_expanded": "One document uses initials where the other spells the words out.",
    "missing_token": "One document leaves out part of the {field} that the other includes.",
    "spelling_variant": "One word in the {field} is spelled differently.",
    "different": "The {field} is different on these documents.",
    "year_only": "One document shows only the year of birth.",
    "day_month_swapped": "The day and month of the date of birth are swapped.",
    "off_by_small": "The date of birth differs in one part (day, month or year).",
    "gender_mismatch": "The gender is different on these documents.",
}

ACTION_CORRECT = "Correct {field} on your {doc} to match your {anchor}"
ACTION_CONFIRM_DOB = "Confirm your full date of birth on your {doc}; it shows only the year"
ACTION_CHOOSE = "Decide which document shows your correct {field}, then mark it as correct"
