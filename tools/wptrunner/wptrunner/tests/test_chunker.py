import unittest
import sys
from os.path import join, dirname
from mozlog import structured

sys.path.insert(0, join(dirname(__file__), "..", "..", ".."))

from manifest.sourcefile import SourceFile

structured.set_default_logger(structured.structuredlog.StructuredLogger("TestChunker"))


testharness_test = """<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>"""


class MockTest(object):
    default_timeout = 10

    def __init__(self, id, path, timeout=10, contents=testharness_test):
        self.id = id
        self.url = "/" + path
        self.item_type = "testharness"
        self.timeout = timeout
        self.source_file = SourceFile("/", path, "/", contents=contents)


def make_mock_manifest(*items):
    rv = []
    for test_type, dir_path, num_tests in items:
        for i in range(num_tests):
            filename = "/%i.html" % i
            rv.append((test_type,
                       dir_path + filename,
                       set([MockTest("%i.html" % i, dir_path + filename)])))
    return rv


if __name__ == "__main__":
    unittest.main()
