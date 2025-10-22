from __future__ import print_function

import os
import re
import sys
import yaml

# Matches trailing whitespace and any following blank lines.
_BLANK_LINES = r"([ \t]*[\r\n]{1,2})*"

# Matches the YAML frontmatter block.
_YAML_PATTERN = re.compile(r"/\*---(.*)---\*/" + _BLANK_LINES, re.DOTALL)

_STRIP_CONTROL_CHARS = re.compile(r'[\x7f-\x9f]')

def yamlAttrParser(testRecord, attrs, name, onerror):
    parsed = yaml.safe_load(re.sub(_STRIP_CONTROL_CHARS, ' ', attrs))
    if parsed is None:
        onerror("Failed to parse yaml in name %s" % name)
        return

    for key in parsed:
        value = parsed[key]
        if key == "info":
            key = "commentary"
        testRecord[key] = value

    if 'flags' in testRecord:
        for flag in testRecord['flags']:
            testRecord[flag] = ""

def findAttrs(src):
    match = _YAML_PATTERN.search(src)
    if not match:
        return (None, None)

    return (match.group(0), match.group(1).strip())

def parseTestRecord(src, name, onerror = print):
    if name.endswith('_FIXTURE.js'):
        return None

    # Find the YAML frontmatter.
    (frontmatter, attrs) = findAttrs(src)

    # YAML frontmatter is required for all tests.
    if frontmatter is None:
        onerror("Missing frontmatter: %s" % name)
        return None

    testRecord = {}
    testRecord['test'] = src

    if attrs:
        yamlAttrParser(testRecord, attrs, name, onerror)

    return testRecord
