import json
import sys
import time
from os.path import dirname, join
from StringIO import StringIO

from mozlog import handlers, structuredlog

sys.path.insert(0, join(dirname(__file__), "..", ".."))
from formatters import chromium


def test_chromium_required_fields(capfd):
    # Test that the test results contain a handful of required fields.

    # Set up the handler.
    output = StringIO()
    logger = structuredlog.StructuredLogger("test_a")
    logger.add_handler(handlers.StreamHandler(output, chromium.ChromiumFormatter()))

    # output a bunch of stuff
    logger.suite_start(["test-id-1"], run_info={}, time=123)
    logger.test_start("test-id-1")
    logger.test_end("test-id-1", status="PASS", expected="PASS")
    logger.suite_end()

    # check nothing got output to stdout/stderr
    # (note that mozlog outputs exceptions during handling to stderr!)
    captured = capfd.readouterr()
    assert captured.out == ""
    assert captured.err == ""

    # check the actual output of the formatter
    output.seek(0)
    output_obj = json.load(output)

    # Check for existence of required fields
    assert "interrupted" in output_obj
    assert "path_delimeter" in output_obj
    assert "version" in output_obj
    assert "num_failures_by_type" in output_obj
    assert "tests" in output_obj

    test_obj = output_obj["tests"]["test-id-1"]
    assert "actual" in test_obj
    assert "expected" in test_obj
