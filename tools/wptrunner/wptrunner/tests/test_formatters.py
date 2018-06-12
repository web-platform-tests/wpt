import json
import sys
import time
from os.path import dirname, join
from StringIO import StringIO

from mozlog import handlers, structuredlog

sys.path.insert(0, join(dirname(__file__), "..", ".."))

from wptrunner.formatters import WptreportFormatter


def test_wptreport_runtime(capfd):
    # setup the logger
    output = StringIO()
    logger = structuredlog.StructuredLogger("test_a")
    logger.add_handler(handlers.StreamHandler(output, WptreportFormatter()))

    # output a bunch of stuff
    logger.suite_start(["test-id-1"], run_info={})
    logger.test_start("test-id-1")
    time.sleep(0.125)
    logger.test_end("test-id-1", "PASS")
    logger.suite_end()

    # check nothing got output to stdout/stderr
    # (note that mozlog outputs exceptions during handling to stderr!)
    captured = capfd.readouterr()
    assert captured.out == ""
    assert captured.err == ""

    # check the actual output of the formatter
    output.seek(0)
    output_obj = json.load(output)
    # be relatively lax in case of low resolution timers
    # 62 is 0.125s = 125ms / 2 = 62ms (assuming int maths)
    # this provides a margin of 62ms, sufficient for even DOS (55ms timer)
    assert output_obj["results"][0]["duration"] >= 62
