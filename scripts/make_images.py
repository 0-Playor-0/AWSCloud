"""Write synthetic test JPEGs (fictional text only) for the preflight and API smoke scripts.

Usage: python scripts/make_images.py OUT_DIR
"""

from __future__ import annotations

import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SAMPLE_LINES = ["SAMPLE CARD - NOT A REAL DOCUMENT", "Name: RAVI KUMAR K",
                "DOB: 14/03/2007", "MALE"]
FAKE_ID_LINE = "9999 9999 9999"  # synthetic 12-digit number to trigger the ID guard


def _jpeg(lines: list[str], size: tuple[int, int] = (1200, 420)) -> bytes:
    img = Image.new("RGB", size, "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=44)
    for i, line in enumerate(lines):
        draw.text((30, 30 + i * 90), line, fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    return buf.getvalue()


def main(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    images = {
        "text": _jpeg(SAMPLE_LINES),
        "id_number": _jpeg([*SAMPLE_LINES[:2], FAKE_ID_LINE]),
        "blank": _jpeg([]),
        "too_wide": _jpeg(SAMPLE_LINES, (1700, 400)),
    }
    for name, data in images.items():
        (out / f"{name}.jpg").write_bytes(data)
        body = {"doc_type": "aadhaar", "image_b64": base64.b64encode(data).decode()}
        (out / f"extract_{name}.json").write_text(json.dumps(body))
    png = io.BytesIO()
    Image.new("RGB", (50, 50), "white").save(png, "PNG")
    body = {"doc_type": "aadhaar", "image_b64": base64.b64encode(png.getvalue()).decode()}
    (out / "extract_png.json").write_text(json.dumps(body))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
