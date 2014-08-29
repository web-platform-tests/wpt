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
UTF-8, marked through the use of `<meta charset=utf-8>` or another
mechanism, or in pure ascii.

## Test Path and Filename

### Location

The correct location for a test depends on the exact spec being
tested. Typically each specification has its own top level directory.

### Path Length

Because of path length limitations on Windows, test paths must be less
thatn 150 characters relative to the test root directory (this gives
vendors just over 100 characters for their own paths when running in
automation).

The file name format is ```test-topic-###.ext``` where ```test-
topic``` somewhat describes the test and ### is a zero-filled number
used to keep the file names unique.

The file name should not use the underscore ("_") character; please
use the hyphen ("-") character instead.


**test-topic**

A short identifier that describes the test. The test-topic should
avoid conjunctions, articles, and prepositions. It is a file name,
not an English phrase: it should be as concise as possible.

Examples:
```
    margin-collapsing-###.ext
    border-solid-###.ext
    float-clear-###.ext
```

**###**

This is a zero-filled number used to keep the file names unique when
files have the same test-topic name.

Note: The number format is limited to 999 cases. If you go over this
number it is recommended that you reevaluate your test-topic name.

For example, in the case of margin-collapsing there are multiple
cases so each case could have the same test-topic but different
numbers:

```
    margin-collapsing-001.xht
    margin-collapsing-002.xht
    margin-collapsing-003.xht
```

There may also be a letter affixed after the number, which can be
used to indicate variants of a test.

For example, ```float-wrap-001l.xht``` and ```float-wrap-001r.xht```
might be left and right variants of a float test.

If tests using both the unsuffixed number and the suffixed number
exist, the suffixed tests must be subsets of the unsuffixed test.

For example, if ```bidi-004``` and ```bidi-004a``` both exist,
```bidi-004a``` must be a subset of ```bidi-004```.

If the unsuffixed test is strictly the union of the suffixed tests, i
.e. covers all aspects of the suffixed tests (such that a user agent
passing the unsuffixed test will, by design, pass all the suffixed
tests), then the unsuffixed test should be marked with the combo flag
.

If ```bidi-004a``` and ```bidi-004b``` cover all aspects of ```bidi-
004``` (except their interaction), then bidi-004 should be given the
combo flag.

**ext**

The file extension or format of the file, usually ```.xht``` for
test files.

## Support files

A number of standard images are provided in the support directory.
These include:

* 1x1 color swatches
* 15x15 color swatches
* 15x15 bordered color swatches
* assorted rulers and red/green grids
* a cat
* a 4-part picture

Additional generic files can be added as necessary, and should have
a descriptive file name. Just like other file name, support files'
file name should not use the underscore ("_") character; use the
hyphen ("-") character instead. Test-specific files should be named
after the test (or test-topic if they are shared across several
tests within a series). If possible tests should not rely on
transparency in images, as they are converted to JPEG (which does
not support transparency) for the xhtml1print version.

## User style sheets

Some test may require special user style sheets to be applied in
order for the case to be verified.

In order for proper indications and prerequisite to be displayed
every user style sheet should contain the following rules.

``` css
#user-stylesheet-indication
{
   /* Used by the harness to display and indication there is a user
   style sheet applied */
    display: block!important;
}
```

The rule ```#user-stylesheet-indication``` is to be used by any
harness running the test suite.

A harness should identify test that need a user style sheet by
looking at their flags meta tag. It then should display appropriate
messages indicating if a style sheet is applied or if a style sheet
should not be applied.

Harness style sheet rules:

``` css
#userstyle
{
    color: green;
    display: none;
}
#nouserstyle
{
    color: red;
    display: none;
}
```

Harness userstyle flag found:

``` html
<p id="user-stylesheet-indication" class="userstyle">A user style
sheet is applied.</p>
```

Harness userstyle flag NOT found:

``` html
<p id="user-stylesheet-indication" class="nouserstyle">A user style
sheet is applied.</p>
```

Within the test case it is recommended that the case itself indicate
the necessary user style sheet that is required.

Examples: (code for the cascade.css file)

``` css
#cascade /* ID name should match user style sheet file name */
{
    /* Used by the test to hide the prerequisite */
    display: none;
}
```

The rule ```#cascade``` in the example above is used by the test
page to hid the prerequisite text. The rule name should match the
user style sheet CSS file name in order to keep this orderly.

Examples: (code for the cascade-### XHTML files)

``` html
<p id="cascade">
    PREREQUISITE: The <a href="support/cascade.css">
    "cascade.css"</a> file is enabled as the user agent's user style
    sheet.
</p>
```

The id value should match the user style sheet CSS file name and the
user style sheet rule that is used to hide this text when the style
sheet is properly applied.

Please flag test that require user style sheets with the userstyle
flag so people running the tests know that a user style sheet is
required.

## HTTP headers

Some tests may require special HTTP headers. These should be
configured using a `[FILENAME.EXT].headers` file located in
the same directory as the relevant file.

<!--
  TODO Document headers format properly.
-->

Please flag tests that require HTTP interaction with the http flag
so people running the tests locally know their results will not be
valid.


[selftest]: ./selftest.html
[reftests]: ./reftests.html
[test-templates]: ./test-templates.html
[requirement-flags]: ./test-templates.html#requirement-flags
[testharness-documentation]: ./testharness-documentation.html
[validator]: http://validator.w3.org
