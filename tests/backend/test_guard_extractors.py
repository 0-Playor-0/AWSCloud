"""ID-number guard and extractor selection."""

import pytest

from backend.guard import contains_id_number, verhoeff_valid


# Synthetic numbers only (all 9s / obviously fake). 9999 9999 9999 and 1111 1111 1115 are
# Verhoeff-valid; 9999 9999 9998 and 1111 1111 1111 are not.
@pytest.mark.parametrize(
    "doc_type,text,hit",
    [
        # Aadhaar / other: any 12-digit number rejects the crop.
        ("aadhaar", "9999 9999 9999", True),
        ("aadhaar", "999999999999", True),
        ("aadhaar", "9999-9999-9999", True),
        ("aadhaar", "9999 9999 9998", True),               # checksum not required here
        ("aadhaar", "1111 1111 1111", True),               # nor a 2–9 first digit
        ("other", "Ref 0000 0000 0000", True),
        ("aadhaar", "XXXX XXXX 9999", False),              # masked Aadhaar is fine
        ("aadhaar", "99999 9999 9999", False),             # 13 digits: not Aadhaar-shaped
        ("aadhaar", "99999999999", False),                 # 11 digits
        ("aadhaar", "DOB: 14/03/2007", False),
        ("aadhaar", "ABCDE9999Z", True),                   # PAN format in an Aadhaar crop
        ("other", "pan abcde9999z", True),
        ("other", "XABCDE9999ZX", False),                  # not a standalone PAN token
        # Other doc types: only a Verhoeff-valid 12-digit number rejects the crop.
        ("passbook", "A/c 999999999999", True),
        ("passbook", "A/c 9999 9999 9998", False),         # ordinary account number
        ("passbook", "A/c 1111 1111 1111", False),
        ("marksheet10", "Roll 1111 1111 1115", True),
        ("passport", "9999-9999-9998", False),
        ("pan", "ABCDE9999Z", False),                      # PAN number allowed on a PAN crop
        ("passport", "ABCDE9999Z", False),
        ("pan", "9999 9999 9999", True),
    ],
)
def test_guard(doc_type: str, text: str, hit: bool) -> None:
    assert contains_id_number(doc_type, text) is hit


@pytest.mark.parametrize(
    "digits,valid",
    [("2363", True), ("2364", False), ("999999999999", True), ("999999999998", False),
     ("111111111115", True), ("000000000003", True), ("0", True), ("1", False)],
)
def test_verhoeff(digits: str, valid: bool) -> None:
    assert verhoeff_valid(digits) is valid


@pytest.mark.parametrize("name", ["textract", "bedrock", ""])
def test_only_client_ocr_is_built(name: str) -> None:
    from backend.extractors import get_extractor

    assert get_extractor("client_ocr").name == "client_ocr"
    with pytest.raises(ValueError):
        get_extractor(name)
