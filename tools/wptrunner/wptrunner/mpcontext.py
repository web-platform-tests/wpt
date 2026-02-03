import multiprocessing
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from multiprocessing.context import SpawnContext


_context: Optional["SpawnContext"] = None


def get_context() -> "SpawnContext":
    global _context

    if _context is None:
        _context = multiprocessing.get_context("spawn")
    return _context
