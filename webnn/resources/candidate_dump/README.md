# WebNN candidate dump

A diagnostic page, not a conformance test. One browser run of it shows which
compute unit diverges from the expected values of a conformance file and by
how much, element by element, before anyone has to reproduce the failure on a
device.

The page loads an unmodified file from `../../conformance_tests/`, runs every
test in it exactly as `webnn_conformance_test` in `../utils.js` would
(`buildAndExecuteGraph`, then `assertResultsEquals` with the file's own
tolerance function), and writes one JSON report with every output element:
the value the implementation produced, the expected value, both as storage
bits for `float32` and `float16`, and the ULP distance (or absolute
difference) the harness computed between them. It also records which
`MLContextOptions` members the implementation reads and a fingerprint of
`opSupportLimits()` for every option set, so the report says whether a `gpu`
run really ran on a different compute unit than the `cpu` run.

Nothing here is run by CI. The directory is under `resources/`, so the
manifest never collects `candidate_dump.https.window.js` as a test, and the
`save.py` handler stores nothing unless the server was started with
`WEBNN_CANDIDATE_DUMP_DIR` set.

## Files

| File | Role |
|---|---|
| `candidate_dump.https.window.js` | The page. wptserve wraps it into `candidate_dump.https.window.html`. |
| `save.py` | Handler that writes the POSTed report under `$WEBNN_CANDIDATE_DUMP_DIR`. |

## Running

1. Set up the hosts file once, as described in
   [Running tests from the local system](../../../docs/running-tests/from-local-system.md),
   and start the server with the output directory in its environment:

   ```sh
   WEBNN_CANDIDATE_DUMP_DIR=/path/to/dumps ./wpt serve
   ```

   Leave the variable unset to run the page without writing anything; the
   page then shows the summary only.

2. Open the page in the browser under test, with the implementation's WebNN
   flags enabled, on the https port (8443 by default) of the wpt host:

   ```
   https://<wpt host>:8443/webnn/resources/candidate_dump/candidate_dump.https.window.html?device=gpu&file=sigmoid
   ```

   The server certificate is the one `./wpt serve` generates; the page above
   explains how to trust it or to start the browser ignoring certificate
   errors.

3. Read the summary at the bottom of the page (one line per test, then the
   path the report was saved to) and open the JSON file for the details. The
   report is also available in the console as `candidateDumpReport`.

Repeat with `device=cpu` and `device=npu` to compare compute units; the file
names differ only in the device, so the reports sit next to each other.

### Query parameters

| Parameter | Required | Meaning |
|---|---|---|
| `device` | yes | `cpu`, `gpu` or `npu`. Read by `utils.js` exactly as in a conformance run, so the context is created with the same `{deviceType}` dictionary. |
| `file` | yes | Stem of a file in `/webnn/conformance_tests/`, for example `sigmoid` for `sigmoid.https.any.js`. Letters, digits, `_` and `-` only. |
| `tc` | no | Name of one test in the file; repeatable. Same meaning as in `utils.js`. Without it, every test in the file runs. |
| `label` | no | Prefix for the saved file name, for example a build number. Letters, digits, `_`, `.` and `-`, at most 64 characters. |

The page status mirrors the harness verdicts: it passes when every test in
the file passed under the file's tolerance, and fails with the summary in its
message otherwise, so a run through any testharness consumer still records
the outcome.

### Saved file

`save.py` writes `<label>__<file>__<device>.json` (without the label part when
none was given) under `$WEBNN_CANDIDATE_DUMP_DIR`, creating the directory if
needed. The name is validated to a single path component and the resolved
path is checked to stay inside that directory; the directory itself cannot be
chosen from the page. An existing file with the same name is overwritten.

## Report schema

Top level (`schemaVersion` 1):

| Field | Content |
|---|---|
| `kind` | Fixed string marking the file as a diagnostic dump, not a conformance result. |
| `schemaVersion` | `1`. |
| `file`, `device`, `label` | The query parameters. |
| `href`, `userAgent`, `userAgentBrands` | Where and in which browser the page ran. |
| `startedAt`, `finishedAt` | ISO 8601 timestamps. |
| `probes.context` | Context probe, see below. |
| `tests[]` | One entry per test in the file (after `tc` filtering), see below. |
| `save` | `{saved: true, path}` or `{saved: false, reason}`. |

`probes.context`:

| Field | Content |
|---|---|
| `contextOptionsFromUtils` | The dictionary `utils.js` built from `?device=`. |
| `optionKeysReadByCreateContext` | Which of `accelerated`, `deviceType`, `powerPreference` the implementation read while converting the dictionary. |
| `contextPrototypeProperties` | Own property names of the `MLContext` prototype. |
| `contextAccelerated`, `contextPowerPreference` | The attributes on the created context, or `"absent"`. |
| `opSupportLimits` | The full `opSupportLimits()` dictionary of the requested device. |
| `opSupportLimitsSha256` | SHA-256 of its JSON serialization. |
| `otherOptionSets` | For `{}`, each `deviceType`, `{accelerated: false}` and each `powerPreference`: the same fingerprint, `preferredInputLayout` and the context attributes, or the creation error. Equal fingerprints mean the option sets most likely resolved to the same compute unit. |

Each `tests[]` entry:

| Field | Content |
|---|---|
| `name` | The test name from the file. |
| `required` | `isMinimumTest(test)`: the test uses only data types and ranks every implementation must support. |
| `supportedByContext` | `validateContextSupportsGraph(context, graph)`. |
| `wouldRunInHarness` | `required || supportedByContext`, the harness's own selection rule. |
| `harnessSubtestName` | The subtest name the harness would have used (`[required]` or `[optional]` prefix). |
| `transport` | Per input and expected output: whether the JSON literals are exactly representable in the declared data type (`checked`, `count`, `notRepresentable`). Values that are not lose information before the graph runs. |
| `inputs` | The input data as written in the file. |
| `standard` | Result of the normal run, see below, or `{error}` when building or executing failed. |
| `descriptorsAfterStandardRun` | `dataType`, `castedType`, `shape` and `constant` of every input and expected output after the run, since `buildAndExecuteGraph` may rewrite descriptors. |
| `probeSharedInputRebuild` | Present only when `standard` failed: the same comparison after rebuilding with one `MLOperand` per input name instead of one `builder.input()` call per reference. Tells a rejected duplicate input name apart from an unsupported graph. |

`standard` (and `probeSharedInputRebuild`):

| Field | Content |
|---|---|
| `tolerance` | `{metricType, value}` returned by the file's tolerance function for this graph. |
| `harnessVerdict` | `PASS` or `FAIL` from `assertResultsEquals`. |
| `harnessMessage` | The assertion message when it failed. |
| `outputs` | Per output name: `dataType` (the casted type when the harness cast it), `shape`, `length`, `expectedLength`, `overBudget` (elements outside the tolerance), `maxDistance` and `maxDistanceIndex`, and `elements[]`. A scalar expected value is expanded to at most `kMaximumIndexToValidate` elements, as in the harness. For `int4` and `uint4` outputs `elements` is `null`. |

Each element of `elements[]`:

| Field | Content |
|---|---|
| `i` | Index in the flattened output. |
| `actual`, `expected` | The values. For `float16` outputs `actual` is decoded from the Uint16 readback. |
| `actualBits`, `expectedBits` | Storage bits as hexadecimal, for `float32` and `float16` only. |
| `ulp` | ULP distance from `ulpDistance` in `utils.js`, for `ULP` tolerances. |
| `absoluteDifference` | For `ATOL` tolerances. |
| `within` | Whether the element is inside the tolerance; for NaN pairs whether both sides agree on being NaN; `null` when no distance could be computed. |

`NaN`, `Infinity`, `-Infinity`, `-0` and 64-bit integers are written as
strings because JSON cannot carry them as numbers.

## Limitations

- Loading the conformance file through a `<script>` element means it runs in
  the window global only; `dedicatedworker` variants are not covered.
- The page overrides `webnn_conformance_test` to capture the file's
  arguments. A file that does anything else at load time runs that code.
- The per-element dump reads the test's expected data directly; outputs
  packed as 4-bit values are covered by the harness verdict only.
