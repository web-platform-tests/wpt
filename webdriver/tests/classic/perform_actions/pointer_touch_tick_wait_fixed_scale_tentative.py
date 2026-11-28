# META: timeout=long
import pytest

from .support.tick_wait import *  # noqa: F401,F403


@pytest.fixture
def variant():
    return "fixed-scale"
