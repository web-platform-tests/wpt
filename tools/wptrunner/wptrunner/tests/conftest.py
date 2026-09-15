import pytest

from ..wptrunner import GlobalLogger


@pytest.fixture(scope="module")
def logging():
    with GlobalLogger({}, {}) as _logger:
        yield _logger
