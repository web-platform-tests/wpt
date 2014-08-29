This page describes the standard test format for all test types.

## Test Locations

Each top level directory in the repository corresponds to tests for a
single specification. For W3C specs, these directories are named after
the shortname of the spec (i.e. the name used for snapshot
publications under `/TR/`).

Within the specification-specific directory there are two common ways
of laying out tests. The first is a flat structure which works well
for very short specifications. The alternative is a nested structure
with each subdirectory corresponding to the id of a heading in the
specification. This layout provides some implicit metadata about the
part of a specification being tested according to its location in the
filesystem, and should be used for larger specifications.

When adding new tests to existing specifications, try to follow the
structure of existing tests.

Because of path length limitations on Windows, test paths must be less
that 150 characters relative to the test root directory (this gives
vendors just over 100 characters for their own paths when running in
automation).

## Choosing the Test Type

Tests should be written using the mechanism that is most conducive to
running in automation. In general the following order of preference holds:

* [idlharness.js][idlharness] tests

* [testharness.js][testharness] tests

* [Reftests][reftests]

* WebDriver tests

* Manual tests

Some scenarios demand certain test types. For example:

* Tests for layout will generally be reftests. In some cases it will
  not be possible to construct a reference and a test that will always
  render the same, in which case a manual test, accompanied by
  testharness tests that inspect the layout via the DOM must be
  written.

* Features that require human interaction for security reasons
  (e.g. to pick a file from the local filesystem) typically have to be
  manual tests.

## Design Requirements

A complete
[guide to writing good testcases](test-style-guidelines.html),
particularly relevant to reftests and manual tests, is avaliable.

### Short

Tests should be as short as possible. For reftests in particular
scrollbars at 800x600px window size must be avoided unless scrolling
behaviour is specifically being tested. For all tests extraneous
elements on the page should be avoided so it is clear what is part of
the test (for a typical testharness test, the only content on the page
will be rendered by the harness itself).

### Minimal

Tests should generally avoid depending on edge case behaviour of
features that they don't explicitly intend to test. For example, except
where testing parsing, tests should be [valid] HTML. Of course tests
which intentionally address the interactions between multiple platform
features are not only acceptable but encouraged.

### Cross-platform

Tests should be as cross-platform as reasonably possible, working
across different devices, screen resolutions, paper sizes, etc.
Exceptions should document their assumptions.

### Self-contained

Tests must not depend on external network resources, including
w3c-test.org. When these tests are run on CI systems they are
typically configured with access to external resources disabled, so
tests that try to access them will fail. Where tests want to use
multiple hosts this is possible thorough a known set of subdomains and
features of wptserve.

## File Formats

Tests must be HTML, XHTML or SVG files.

Note: For CSS tests, the test source will be parsed and re-
serialized. This re-serialization will cause minor changes to the test
file, notably: attribute values will always be quoted, whitespace
between attributes will be collapsed to a single space, duplicate
attributes will be removed, optional closing tags will be inserted,
and invalid markup will be normalized.  If these changes should make
the test inoperable, for example if the test is testing markup error
recovery, add the [flag][requirement-flags] 'asis' to prevent
re-serialization. This flag will also prevent format conversions so it
may be necessary to provide alternate versions of the test in other
formats (XHTML, HTML, etc.)

## Character Encoding

Except when specifically testing encoding, tests must be encoded in
UTF-8, marked through the use of e.g. `<meta charset=utf-8>`, or in
pure ASCII.

## Style Rules

A number of style rules should be applied to the test file. These are
not uniformly enforced throughout the existing tests, but will be for
new tests. Any of these rules may be broken if the test demands it:

 * No trailing whitespace

 * Use tabs rather than spaces for indentation

 * Use UNIX-style line endings (i.e. no CR characters at EOL).

## Test lint

A lint tool is avaliable to catch common mistakes in tests. It may be
run from the web-platform-tests home directory using:

    python tools/script/lint.py

The lint is run automatically on every pull request and any violations
of the rules will be regarded as an error. In order to silence
unwanted linter errors, add the error to the whitelist in
`tools/scripts/lint.whitelist`.

[selftest]: ./selftest.html
[reftests]: ./reftests.html
[test-templates]: ./test-templates.html
[requirement-flags]: ./test-templates.html#requirement-flags
[testharness-documentation]: ./testharness-documentation.html
[validator]: http://validator.w3.org
