# META: timeout=long
import pytest

from .support.tick_wait import *  # noqa: F401,F403

pytestmark = pytest.mark.asyncio


@pytest.fixture
def variant():
    return "none"
