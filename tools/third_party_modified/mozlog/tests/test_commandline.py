# -*- coding: utf-8 -*-

import argparse
import os
import tempfile
import unittest

from mozlog import commandline, formatters, handlers


class TestCommandline(unittest.TestCase):
    def test_formatter_option(self):
        """Test that formatter options work correctly.

        This is a regression test for a bug where --log-level would wrap the formatter
        instead of the handler, preventing formatter-specific options from reaching
        the formatter.
        """

        class CustomFormatter(formatters.base.BaseFormatter):
            def __init__(self):
                super().__init__()
                self.custom_value = None

        def custom_option_wrapper(formatter, value):
            formatter.custom_value = value
            return formatter

        original_formatters = commandline.log_formatters.copy()
        original_fmt_options = commandline.fmt_options.copy()

        self.addCleanup(
            lambda: setattr(commandline, "log_formatters", original_formatters)
        )
        self.addCleanup(
            lambda: setattr(commandline, "fmt_options", original_fmt_options)
        )

        commandline.log_formatters["custom"] = (
            CustomFormatter,
            "Custom formatter for testing",
        )

        commandline.fmt_options["customopt"] = (
            custom_option_wrapper,
            "Custom option for testing",
            {"custom"},
            "store",
        )

        parser = argparse.ArgumentParser(prog="test_formatter_option")
        commandline.add_logging_group(parser)

        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.close()
        self.addCleanup(lambda: os.unlink(temp_file.name))

        args = parser.parse_args(
            [
                "--log-custom=%s" % temp_file.name,
                "--log-custom-customopt=test_value",
            ]
        )

        logger = commandline.setup_logging("test_formatter_option", args, {})

        self.assertEqual(len(logger.handlers), 1)
        self.assertIsInstance(logger.handlers[0], handlers.base.LogLevelFilter)
        log_filter = logger.handlers[0]

        self.assertIsInstance(log_filter.inner, handlers.StreamHandler)
        handler = log_filter.inner
        self.addCleanup(lambda: handler.stream.close())

        self.assertIsInstance(handler.formatter, CustomFormatter)
        formatter = handler.formatter

        self.assertEqual(formatter.custom_value, "test_value")


if __name__ == "__main__":
    import mozunit
    mozunit.main()
