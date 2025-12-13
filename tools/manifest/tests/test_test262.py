# type: ignore
import unittest

from tools.manifest.test262 import TestRecord

class TestTest262Parser(unittest.TestCase):
    def test_basic_parse(self) -> None:
        src = """/*---
description: A simple test
features: [Test262]
---*/
assert.sameValue(1, 1);
"""
        name = "test.js"
        record = TestRecord.parse(src, name)
        self.assertIsNotNone(record)
        self.assertEqual(record["description"], "A simple test")
        self.assertEqual(record["features"], ["Test262"])
        self.assertEqual(record["test"], src)

    def test_no_frontmatter(self) -> None:
        src = """assert.sameValue(1, 1);"""
        name = "no_frontmatter.js"
        record = TestRecord.parse(src, name)
        self.assertIsNone(record)

    def test_fixture_file(self) -> None:
        src = """/*---
description: A fixture file
---*/
assert.sameValue(1, 1);
"""
        name = "test_FIXTURE.js"
        record = TestRecord.parse(src, name)
        self.assertIsNone(record)

    def test_flags_parsing(self) -> None:
        src = """/*---
description: Test with flags
flags: [raw, module]
---*/
assert.sameValue(1, 1);
"""
        name = "flags.js"
        record = TestRecord.parse(src, name)
        self.assertIsNotNone(record)
        self.assertIn("raw", record)
        self.assertIn("module", record)
        self.assertEqual(record["flags"], ["raw", "module"])

    def test_negative_parsing(self) -> None:
        src = """/*---
description: Negative test
negative:
  phase: runtime
  type: TypeError
---*/
throw new TypeError();
"""
        name = "negative.js"
        record = TestRecord.parse(src, name)
        self.assertIsNotNone(record)
        self.assertEqual(record["negative"]["type"], "TypeError")
        self.assertEqual(record["negative"]["phase"], "runtime")

    def test_includes_parsing(self) -> None:
        src = """/*---
description: Test with includes
includes: [assert.js, sta.js]
---*/
assert.sameValue(1, 1);
"""
        name = "includes.js"
        record = TestRecord.parse(src, name)
        self.assertIsNotNone(record)
        self.assertEqual(record["includes"], ["assert.js", "sta.js"])

if __name__ == '__main__':
    unittest.main()
