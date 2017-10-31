WebRTC Coverage Report
======================

This directory contains the coverage report annotated together with normative
text copied from webrtc-pc. The objective is to allow contributors on both sides
get a quick glance on the coverage status of the tests against the latest
editor's draft.

## File Format

The report file format is in YAML to help with readability, version control, and
parsing. Each file is named with the section number followed by hyphenated title
of that section.

The root of each file has the following fields:

  - `spec_url` (required) - This links to the specific editor's draft at the
    time the report file is written. This is to help with keeping the report
    versions in sync with the spec. When the spec is updated to a new
    version, report files can be updated individually to reflect the latest
    changes.

  - `section` and `desc` (required) - The section number and full title of
    the reported section.

  - `steps` (required) - The steps in the section. Each step entry follows
    the format in [Step](#step)

## Step

Step is used as the base unit when calculating coverage. A step may be
considered as a piece of normative test that require testing. It may be a
numbered item, a list item, a paragraph, or few related sentences.

Each step entry has the following fields:

  - `step` (optional) - The number assigned to the step, if any. If set, the
    number should be a single integer and nested numbering is not allowed,
    e.g. 1.3.2. Note that multiple steps may have the same number, if we
    break down long description into multiple test units.

  - `status` (required) - The test status of the step, as described in
    [Status](#status).

  - `files` - If the status is `tested`, the `files` array indicate which test
    file contains the test case for testing the step. The file names are entered
    without the file extension, e.g. .html.

  - `desc` (required) - The content of the step. This is copied directly from
    the spec. Having a copy of the description helps detect when a test case
    is testing with outdated description of a step.

  - `steps` (optional) - If a step has sub items, this field is used to hold
    an array of sub steps following the same format.

## Status

Each step has a status to indicate the test status of a step. There are
currently four types of statuses:

  - `tested` - The step has been tested in the test files specified in the
    `files` field.

  - `todo` - The step needs testing but no test has yet to be written.

  - `untestable` - The step is untestable using plain JavaScript, or testing it
    is out of scope.

  - `trivial` - The step contains trivial description and do not need dedicated
    test case for it. This is often the case for the first few steps of an
    algorithm description.

## Coverage Tools

Since the coverage report is written in YAML, it is straightforward to write
tools to extract various information from it. The [tools](../tools) directory
has some simple Node.js scripts to get an overview of the coverage status of
the project.
