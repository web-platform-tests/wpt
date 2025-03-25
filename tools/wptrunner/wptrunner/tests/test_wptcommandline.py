# mypy: allow-untyped-defs

import sys

import pytest
from mozlog import commandline, structuredlog

from .. import wptcommandline, wptlogging
from ..formatters.wptscreenshot import WptscreenshotFormatter
from .base import active_products


@pytest.fixture
def formatter_factory(request, monkeypatch, tmp_path):
    def _formatter_factory(product, args, formatter_cls):
        # Use a per-test name for the logger we create and setup
        original_setup_logging = commandline.setup_logging
        monkeypatch.setattr(
            commandline,
            "setup_logging",
            lambda *args, **kwargs: original_setup_logging(
                request.node.name, *args[1:], **kwargs
            ),
        )

        # Avoid overriding the root logger
        monkeypatch.setattr(
            wptlogging,
            "setup_stdlib_logger",
            lambda *args, **kwargs: None,
        )

        # Don't touch the mozlog default logger
        monkeypatch.setattr(
            structuredlog,
            "set_default_logger",
            lambda *args, **kwargs: None,
        )

        with monkeypatch.context() as m:
            m.setattr(
                "sys.argv",
                [
                    "test_wptcommandline#test_logging_options",
                    "--tests",
                    str(tmp_path),
                    "--metadata",
                    str(tmp_path),
                    "--product",
                    product,
                    *args,
                ],
            )
            kwargs = wptcommandline.parse_args()

        logger = wptlogging.setup(kwargs, {"raw": sys.stdout})

        stack = list(logger.handlers)
        while stack:
            item = stack.pop()
            if isinstance(item, formatter_cls):
                return item
            if hasattr(item, "message_handler"):
                stack.extend(item.message_handler.wrapped)

        raise Exception("Unable to find formatter")

    return _formatter_factory


@active_products("product")  # type: ignore[no-untyped-call]
def test_wptscreenshot_api(product, formatter_factory, tmp_path):
    api = "http://test.invalid/"

    formatter = formatter_factory(
        product,
        [
            "--log-wptscreenshot",
            str(tmp_path / "wpt_screenshot.txt"),
            "--log-wptscreenshot-api",
            api,
        ],
        WptscreenshotFormatter,
    )

    assert formatter is not None
    assert formatter.api == api
