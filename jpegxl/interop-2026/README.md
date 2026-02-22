# JPEG XL Interop 2026 test scaffold

This directory contains Chromium-side JPEG XL Interop 2026 test scaffolding.

## Fixture sources

- Existing WPT JPEG XL fixtures from `external/wpt/jpegxl/resources/`.
- Additional curated fixtures copied from:
  - `~/jxl-rs/jxl/resources/test/`
  - `~/jxl-rs/jxl/resources/test/conformance_test_images/`

## Test types in this directory

- Automated `testharness` tests for API/integration and decode assertions.
- Automated visual `reftest` pairs (`*-reftest.html` and `*-reftest-ref.html`) for
  decoder-output comparison against PNG references.
- Manual placeholders for areas that are still infra-sensitive (`*.manual.html`).

## Regenerating fixtures

Run:

- `third_party/blink/web_tests/external/wpt/jpegxl/interop-2026/resources/generate_resources.sh`

The script:
- copies core fixtures from Chromium `external/wpt/jpegxl/resources/`
- copies optional fixtures from local `jxl-rs` checkout (if present)
- regenerates PNG references used by reftests via `djxl`

## Tool versions used while creating this scaffold

- `cjxl v0.7.0`
- `djxl v0.7.0`
- `jxlinfo` from the same system JPEG XL tools package (no version flag available)

## Running tests locally (JXL virtual suite)

- Interop directory only:
  - `third_party/blink/tools/run_web_tests.py -t Default virtual/jxl-enabled/external/wpt/jpegxl/interop-2026/`
- Full JPEG XL directory:
  - `third_party/blink/tools/run_web_tests.py -t Default virtual/jxl-enabled/external/wpt/jpegxl/`
