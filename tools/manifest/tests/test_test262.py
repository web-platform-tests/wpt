# mypy: allow-untyped-defs

import pytest

from tools.manifest.test262 import TestRecord

@pytest.mark.parametrize("name, src, expected_record", [
    (
        "test.js",
        """/*---
description: A simple test
features: [Test262]
---*/
assert.sameValue(1, 1);
""",
        {"description": "A simple test", "features": ["Test262"]}
    ),
    (
        "no_frontmatter.js",
        """assert.sameValue(1, 1);""",
        None
    ),
    (
        "test_FIXTURE.js",
        """/*---
description: A fixture file
---*/
assert.sameValue(1, 1);
""",
        None
    ),
    (
        "flags.js",
        """/*---
description: Test with flags
flags: [raw, module]
---*/
assert.sameValue(1, 1);
""",
        {"flags": ["raw", "module"]}
    ),
    (
        "negative.js",
        """/*---
description: Negative test
negative:
  phase: runtime
  type: TypeError
---*/
throw new TypeError();
""",
        {"negative": {"phase": "runtime", "type": "TypeError"}}
    ),
    (
        "includes.js",
        """/*---
description: Test with includes
includes: [assert.js, sta.js]
---*/
assert.sameValue(1, 1);
""",
        {"includes": ["assert.js", "sta.js"]}
    ),
])
def test_test262_parser(name, src, expected_record):
    record = TestRecord.parse(src, name)

    if expected_record is None:
        assert record is None
    else:
        assert record is not None
        for key, value in expected_record.items():
            assert key in record
            assert record[key] == value
        assert record["test"] == src
