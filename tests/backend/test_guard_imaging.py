"""ID-number guard and JPEG validation."""

import base64
import io

import pytest
from PIL import Image

from backend import imaging
from backend.errors import ApiError
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


def _jpeg(width: int, height: int, progressive: bool = False) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), "white").save(buf, "JPEG", progressive=progressive)
    return buf.getvalue()


@pytest.mark.parametrize("w,h,prog", [(600, 200, False), (1600, 900, False), (300, 1200, True)])
def test_jpeg_size(w: int, h: int, prog: bool) -> None:
    assert imaging.jpeg_size(_jpeg(w, h, prog)) == (w, h)


def _png() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buf, "PNG")
    return buf.getvalue()


@pytest.mark.parametrize("data", [b"", b"\xff\xd8\xff", b"\xff\xd8\xff\xe0\x00", _png(),
                                  b"\xff\xd8\xff\xe0\x00\x01xx"])
def test_jpeg_size_rejects_garbage(data: bytes) -> None:
    assert imaging.jpeg_size(data) is None


@pytest.mark.parametrize(
    "payload,code",
    [
        ("not base64!!", "invalid_image"),
        (base64.b64encode(_png()).decode(), "invalid_image"),
        (base64.b64encode(_jpeg(1601, 100)).decode(), "image_too_large"),
        (base64.b64encode(b"\xff\xd8\xff" + b"\x00" * 1_500_001).decode(), "image_too_large"),
    ],
)
def test_decode_image_errors(payload: str, code: str) -> None:
    with pytest.raises(ApiError) as exc:
        imaging.decode_image(payload)
    assert exc.value.code == code


def test_decode_image_ok() -> None:
    data = _jpeg(800, 300)
    assert imaging.decode_image(base64.b64encode(data).decode()) == data
