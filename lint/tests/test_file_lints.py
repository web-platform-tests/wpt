from __future__ import unicode_literals

from ..lint import check_file_contents
import pytest
import six

INTERESTING_FILE_NAMES = {
    "python": [
        "test.py",
    ],
    "web": [
        "test.htm",
        "test.html",
        "test.js",
        "test.svg",
        "test.xht",
        "test.xhtml",
    ],
}

def check_with_files(input_bytes):
    return {
        filename: (check_file_contents("", filename, six.BytesIO(input_bytes)), kind)
        for (kind, filenames) in INTERESTING_FILE_NAMES.items()
        for filename in filenames
    }


def test_trailing_whitespace():
    error_map = check_with_files(b"test; ")

    for (filename, (errors, _)) in error_map.items():
        assert errors == [("TRAILING WHITESPACE", "Whitespace at EOL", filename, 1)]


def test_indent_tabs():
    error_map = check_with_files(b"def foo():\n\x09pass")

    for (filename, (errors, _)) in error_map.items():
        assert errors == [("INDENT TABS", "Tabs used for indentation", filename, 2)]


def test_cr_not_at_eol():
    error_map = check_with_files(b"line1\rline2\r")

    for (filename, (errors, _)) in error_map.items():
        assert errors == [("CR AT EOL", "CR character in line separator", filename, 1)]


def test_cr_at_eol():
    error_map = check_with_files(b"line1\r\nline2\r\n")

    for (filename, (errors, _)) in error_map.items():
        assert errors == [
            ("CR AT EOL", "CR character in line separator", filename, 1),
            ("CR AT EOL", "CR character in line separator", filename, 2),
        ]


def test_w3c_test_org():
    error_map = check_with_files(b"import('http://www.w3c-test.org/')")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("W3C-TEST.ORG", "External w3c-test.org domain used", filename, 1)]
        if kind == "python":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, 1))
        assert errors == expected


def test_webidl2_js():
    error_map = check_with_files(b"<script src=/resources/webidl2.js>")

    for (filename, (errors, kind)) in error_map.items():
        expected = [("WEBIDL2.JS", "Legacy webidl2.js script used", filename, 1)]
        if kind == "python":
            expected.append(("PARSE-FAILED", "Unable to parse file", filename, 1))
        assert errors == expected


def test_console():
    error_map = check_with_files(b"console.log('error');\nconsole.error ('log')\n")

    for (filename, (errors, kind)) in error_map.items():
        if kind == "web":
            assert errors == [
                ("CONSOLE", "Console logging API used", filename, 1),
                ("CONSOLE", "Console logging API used", filename, 2),
            ]
        else:
            assert errors == []


@pytest.mark.skipif(six.PY3, reason="Cannot parse print statements from python 3")
def test_print_statement():
    error_map = check_with_files(b"def foo():\n  print 'statement'\n  print\n")

    for (filename, (errors, kind)) in error_map.items():
        if kind == "python":
            assert errors == [
                ("PRINT STATEMENT", "Print function used", filename, 2),
                ("PRINT STATEMENT", "Print function used", filename, 3),
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
        else:
            assert errors == []
