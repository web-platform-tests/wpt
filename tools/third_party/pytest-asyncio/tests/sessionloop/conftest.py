import asyncio

import pytest


class CustomSelectorLoopSession(asyncio.SelectorEventLoop):
    """A subclass with no overrides, just to test for presence."""

    pass


loop = CustomSelectorLoopSession()


@pytest.fixture(scope="package")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    yield loop
    loop.close()
