# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import unicode_literals

import sys
import time

import logging
from mach import logging as mach_logging

from mozlog.structured import stdadapter
from mozlog.structured.handlers import StreamHandler, LogLevelFilter
from mozlog.structured.formatters import JSONFormatter, machformatter

format_seconds = mach_logging.format_seconds


class StructuredLoggingManager(mach_logging.LoggingManager):
    def __init__(self):
        self.start_time = time.time()

        root_logger = logging.getLogger()
        if not hasattr(root_logger, "add_handler"):
            root_logger = stdadapter.std_logging_adapter(root_logger)

        self.structured_loggers = []

        self._terminal = None

    def add_json_handler(self, fh):
        handler = StreamHandler(stream=fh, formatter=JSONFormatter)

        for logger in self.structured_loggers:
            logger.add_handler(handler)

    def add_terminal_logging(self, fh=sys.stdout, level=logging.INFO,
                             write_interval=False, write_times=True):

        formatter = machformatter.MachFormatter(self.start_time,
                                                write_interval=write_interval,
                                                write_times=write_times)

        if self.terminal:
            formatter = machformatter.MachTerminalFormatter(self.start_time,
                                                            write_interval=write_interval,
                                                            write_times=write_times,
                                                            terminal=self.terminal)

        handler = StreamHandler(stream=fh, formatter=formatter)
        handler = LogLevelFilter(handler, logging.getLevelName(level))

        for logger in self.structured_loggers:
            logger.add_handler(handler)

        self.terminal_handler = handler
        self.terminal_formatter = formatter

    def register_structured_logger(self, logger):
        """Register a structured logger.

        This needs to be called for all structured loggers that don't chain up
        to the mach logger in order for their output to be captured.
        """
        if not hasattr(logger, "add_handler"):
            logger = self.logging_wrapper(logger)
        self.structured_loggers.append(logger)
