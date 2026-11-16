"""Namma Check comparison engine. Pure Python: no AWS, no network."""

from .compare import PURPOSES, EngineInputError, compare

__all__ = ["PURPOSES", "EngineInputError", "compare"]
