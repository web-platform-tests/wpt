from __future__ import unicode_literals

from ..lint import check_file_contents
import os
import pytest
import six

INTERESTING_FILE_NAMES = {
    "python": [
        "test.py",
    ],
    "web-lax": [
        "test.htm",
        "test.html",
        "test.js",
    ],
    "web-strict": [
        "test.svg",
        "test.xht",
        "test.xhtml",
    ],
}

def check_with_files(input_bytes):
    return {
        filename: (check_file_contents("", filename, six.BytesIO(input_bytes)), kind)
        for (filename, kind) in
        (
            (os.path.join("html", filename), kind)
            for (kind, filenames) in INTERESTING_FILE_NAMES.items()
            for filename in filenames
        )
    }


def test_trailing_whitespace():
    error_map = check_with_files(b"test; ")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("TRAILING WHITESPACE", "Whitespace at EOL", filename, 1)]
        if kind == "web-strict":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, None))
        assert errors == expected


def test_indent_tabs():
    error_map = check_with_files(b"def foo():\n\x09pass")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("INDENT TABS", "Tabs used for indentation", filename, 2)]
        if kind == "web-strict":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, None))
        assert errors == expected


def test_cr_not_at_eol():
    error_map = check_with_files(b"line1\rline2\r")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("CR AT EOL", "CR character in line separator", filename, 1)]
        if kind == "web-strict":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, None))
        assert errors == expected


def test_cr_at_eol():
    error_map = check_with_files(b"line1\r\nline2\r\n")

    for (filename, (errors, kind)) in error_map.items():
        expected = [
            ("CR AT EOL", "CR character in line separator", filename, 1),
            ("CR AT EOL", "CR character in line separator", filename, 2),
        ]
        if kind == "web-strict":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, None))
        assert errors == expected


def test_w3c_test_org():
    error_map = check_with_files(b"import('http://www.w3c-test.org/')")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("W3C-TEST.ORG", "External w3c-test.org domain used", filename, 1)]
        if kind == "python":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, 1))
        elif kind == "web-strict":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, None))
        assert errors == expected


def test_webidl2_js():
    error_map = check_with_files(b"<script src=/resources/webidl2.js>")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("WEBIDL2.JS", "Legacy webidl2.js script used", filename, 1)]
        if kind == "python":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, 1))
        elif kind == "web-strict":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, None))
        assert errors == expected


def test_console():
    error_map = check_with_files(b"<script>\nconsole.log('error');\nconsole.error ('log')\n</script>")

    for (filename, (errors, kind)) in error_map.items():
        if kind in ["web-lax", "web-strict"]:
            assert errors == [
                ("CONSOLE", "Console logging API used", filename, 2),
                ("CONSOLE", "Console logging API used", filename, 3),
            ]
        else:
            assert errors == [("PARSE-FAILED", "Unable to parse file", filename, 1)]

@pytest.mark.skipif(six.PY3, reason="Cannot parse print statements from python 3")
def test_print_statement():
    error_map = check_with_files(b"def foo():\n  print 'statement'\n  print\n")

    for (filename, (errors, kind)) in error_map.items():
        if kind == "python":
            assert errors == [
                ("PRINT STATEMENT", "Print function used", filename, 2),
                ("PRINT STATEMENT", "Print function used", filename, 3),
            ]
        elif kind == "web-strict":
            assert errors == [
                ("PARSE-FAILED", "Unable to parse file", filename, None),
            ]
        else:
            assert errors == []


def test_print_function():
    error_map = check_with_files(b"def foo():\n  print('function')\n")

    for (filename, (errors, kind)) in error_map.items():
        if kind == "python":
            assert errors == [
                ("PRINT STATEMENT", "Print function used", filename, 2),
            ]
        elif kind == "web-strict":
            assert errors == [
                ("PARSE-FAILED", "Unable to parse file", filename, None),
            ]
        else:
            assert errors == []


open_mode_code = """
def first():
    return {0}("test.png")

def second():
    return {0}("test.png", "r")

def third():
    return {0}("test.png", "rb")

def fourth():
    return {0}("test.png", encoding="utf-8")

def fifth():
    return {0}("test.png", mode="rb")
"""


def test_open_mode():
    for method in ["open", "file"]:
        code = open_mode_code.format(method).encode("utf-8")
        errors = check_file_contents("", "test.py", six.BytesIO(code))

        message = ("File opened without providing an explicit mode (note: " +
                   "binary files must be read with 'b' in the mode flags)")

        assert errors == [
            ("OPEN-NO-MODE", message, "test.py", 3),
            ("OPEN-NO-MODE", message, "test.py", 12),
        ]
