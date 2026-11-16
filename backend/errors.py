"""API errors in the contract shape: {"error": {"code", "message", "hint"}}."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ApiError(Exception):
    status: int
    code: str
    message: str
    hint: str

    def body(self) -> dict[str, dict[str, str]]:
        return {"error": {"code": self.code, "message": self.message, "hint": self.hint}}


def invalid_request(message: str) -> ApiError:
    return ApiError(400, "invalid_request", message, "Check the request format and try again.")


def invalid_image() -> ApiError:
    return ApiError(
        400, "invalid_image", "The image could not be read as a JPEG.",
        "Crop the photo again in the app and resend it.",
    )


def image_too_large() -> ApiError:
    return ApiError(
        413, "image_too_large", "The image is too large.",
        "Crop closer to the name and date of birth. The app resizes images to 1600 px.",
    )


def request_too_large() -> ApiError:
    return ApiError(413, "request_too_large", "The request is too large.",
                    "Send fewer or shorter fields.")


def id_number_detected() -> ApiError:
    return ApiError(
        422, "id_number_detected",
        "The image seems to include an ID number. We discarded it without reading further.",
        "Crop again so only the name, date of birth and gender are visible. "
        "Leave out the Aadhaar number, photo and QR code.",
    )


def unreadable() -> ApiError:
    return ApiError(
        422, "unreadable", "We could not find a name, date of birth or gender in the image.",
        "Retake the photo in good light, crop to the text, or type the fields instead.",
    )


def daily_cap_reached() -> ApiError:
    return ApiError(
        429, "daily_cap_reached", "Photo reading is paused for today.",
        "Type the fields from your document instead. Typed checks work as normal.",
    )


def throttled() -> ApiError:
    return ApiError(429, "throttled", "Too many requests right now.",
                    "Wait a few seconds and try again.")


def extractor_failed() -> ApiError:
    return ApiError(502, "extractor_failed", "Reading the image failed.",
                    "Try once more, or type the fields instead.")


def not_found() -> ApiError:
    return ApiError(404, "not_found", "No such route.", "Check the URL.")


def internal_error() -> ApiError:
    return ApiError(500, "internal_error", "Something went wrong on our side.",
                    "Try again in a minute.")
