from typing import Generator

import pytest
from mozlog import structuredlog


@pytest.fixture(autouse=True)
def mozlog_default_logger(request: pytest.FixtureRequest) -> Generator[structuredlog.StructuredLogger, None, None]:
    """Create a new StructuredLogger and make it the default"""
    nodeid = request.node.nodeid

    old_default_logger = structuredlog._default_logger_name
    try:
        logger = structuredlog.StructuredLogger(nodeid)
        logger.reset_state()
        structuredlog.set_default_logger(logger)
        yield logger
        logger.reset_state()
    finally:
        structuredlog._default_logger_name = old_default_logger
