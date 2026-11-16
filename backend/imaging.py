"""Validate an uploaded JPEG without decoding pixels (no image library in the Lambda)."""

from __future__ import annotations

import base64
import binascii

from . import errors

MAX_DECODED_BYTES = 1_500_000
MAX_SIDE_PX = 1600
_SOF_MARKERS = frozenset({0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD,
                          0xCE, 0xCF})


def jpeg_size(data: bytes) -> tuple[int, int] | None:
    """Return (width, height) from the first SOF segment, or None if not a parsable JPEG."""
    if not data.startswith(b"\xff\xd8\xff"):
        return None
    i = 2
    while i + 4 <= len(data):
        if data[i] != 0xFF:
            return None
        marker = data[i + 1]
        if marker == 0xFF:  # fill byte
            i += 1
            continue
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        length = int.from_bytes(data[i + 2 : i + 4], "big")
        if length < 2:
            return None
        if marker in _SOF_MARKERS:
            if i + 9 > len(data):
                return None
            height = int.from_bytes(data[i + 5 : i + 7], "big")
            width = int.from_bytes(data[i + 7 : i + 9], "big")
            return (width, height) if width and height else None
        i += 2 + length
    return None


def decode_image(image_b64: str) -> bytes:
    """Decode and validate; raises ApiError (invalid_image / image_too_large)."""
    try:
        data = base64.b64decode(image_b64, validate=True)
    except (binascii.Error, ValueError):
        raise errors.invalid_image() from None
    if len(data) > MAX_DECODED_BYTES:
        raise errors.image_too_large()
    size = jpeg_size(data)
    if size is None:
        raise errors.invalid_image()
    if max(size) > MAX_SIDE_PX:
        raise errors.image_too_large()
    return data
