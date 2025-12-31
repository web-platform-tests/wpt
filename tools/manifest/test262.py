from __future__ import print_function

from typing import Dict, Optional, Text, Tuple, Any, Callable

import re

# Matches trailing whitespace and any following blank lines.
_BLANK_LINES = r"([ \t]*[\r\n]{1,2})*"

# Matches the YAML frontmatter block.
_YAML_PATTERN = re.compile(r"/\*---(.*)---\*/" + _BLANK_LINES, re.DOTALL)

_STRIP_CONTROL_CHARS = re.compile(r'[\x7f-\x9f]')


class TestRecord:
    @staticmethod
    def _yaml_attr_parser(test_record: Dict[Text, Any], attrs: Text, name: Text, onerror: Callable[[Text], Any]) -> None:
        import yaml
        parsed = yaml.safe_load(re.sub(_STRIP_CONTROL_CHARS, ' ', attrs))
        if parsed is None:
            onerror("Failed to parse yaml in name %s" % name)
            return

        for key in parsed:
            value = parsed[key]
            if key == "info":
                key = "commentary"
            test_record[key] = value

        if 'flags' in test_record:
            for flag in test_record['flags']:
                test_record[flag] = ""

    @staticmethod
    def _find_attrs(src: Text) -> Tuple[Optional[Text], Optional[Text]]:
        match = _YAML_PATTERN.search(src)
        if not match:
            return (None, None)

        return (match.group(0), match.group(1).strip())

    @staticmethod
    def parse(src: Text, name: Text, onerror: Callable[[Text], Any] = print) -> Optional[Dict[Text, Any]]:
        if name.endswith('_FIXTURE.js'):
            return None

        # Find the YAML frontmatter.
        (frontmatter, attrs) = TestRecord._find_attrs(src)

        # YAML frontmatter is required for all tests.
        if frontmatter is None:
            onerror("Missing frontmatter: %s" % name)
            return None

        test_record: Dict[Text, Any] = {}
        test_record['test'] = src

        if attrs:
            TestRecord._yaml_attr_parser(test_record, attrs, name, onerror)

        return test_record
