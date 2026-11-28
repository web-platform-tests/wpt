// META: title=WebNN candidate dump (diagnostic page, not a conformance test)
// META: script=/webnn/resources/utils.js
// META: timeout=long

'use strict';

// Diagnostic page, not a test. It lives under resources/ so the manifest never
// collects it and no CI job opens it. Serve the repository with `./wpt serve`
// and open
//
//   /webnn/resources/candidate_dump/candidate_dump.https.window.html
//       ?device=<cpu|gpu|npu>&file=<conformance file stem>
//       [&tc=<test name>]...[&label=<run label>]
//
// The page loads /webnn/conformance_tests/<file>.https.any.js unmodified,
// captures the test list, build function and tolerance function the file
// passes to webnn_conformance_test, runs every selected test through the same
// buildAndExecuteGraph and assertResultsEquals as a conformance run, and
// records every output element (value, storage bits, ULP distance) in one
// JSON report. The report is POSTed to save.py, which writes it under
// $WEBNN_CANDIDATE_DUMP_DIR when the server was started with that variable
// set; see README.md in this directory for the schema. utils.js reads
// ?device= itself, so the context options are the same {deviceType}
// dictionary a conformance run uses.
//
// Entries labelled "probe" are not part of any conformance test: the context
// option reads and opSupportLimits fingerprints, and a shared-input rebuild
// attempted only when the standard build fails.

const kConformanceFilePattern = /^[A-Za-z0-9_-]+$/;
const kLabelPattern = /^[A-Za-z0-9_.-]{1,64}$/;

const dumpParams = new URLSearchParams(location.search);
const dumpDevice = dumpParams.get('device');
const dumpFile = dumpParams.get('file');
const dumpLabel = dumpParams.get('label');

// utils.js declares webnn_conformance_test as the entry point every
// conformance file calls at load time. Replace it so that loading the file
// only records its arguments.
let capturedCandidate = null;
webnn_conformance_test = (tests, buildFunc, toleranceFunc) => {
  capturedCandidate = {tests, buildFunc, toleranceFunc};
};

const loadScript = (src) => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = src;
  script.onload = resolve;
  script.onerror = () => reject(new Error(`failed to load ${src}`));
  document.head.appendChild(script);
});

const sha256Hex = async (text) => {
  const digest =
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
};

const hex = (value, digits) =>
    '0x' + value.toString(16).padStart(digits, '0');

const float32Bits = (value) => {
  const buffer = new ArrayBuffer(4);
  new Float32Array(buffer)[0] = value;
  return hex(new Uint32Array(buffer)[0], 8);
};

// JSON has no NaN, infinities, -0 or BigInt; keep them readable as strings.
const jsonNumber = (value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value !== 'number') {
    return value;
  }
  if (Number.isNaN(value)) {
    return 'NaN';
  }
  if (value === Infinity) {
    return 'Infinity';
  }
  if (value === -Infinity) {
    return '-Infinity';
  }
  if (Object.is(value, -0)) {
    return '-0';
  }
  return value;
};

const errorString = (e) => `${e && e.name}: ${e && e.message}`;

const asArray = (data) => Array.isArray(data) ? data : [data];

// Whether the JSON literals in a conformance file are exactly representable
// in the declared storage type. A value that is not loses information before
// the graph runs, which can look like an implementation divergence.
const checkTransport = (graph) => {
  const representable = (value, dataType) => {
    switch (dataType) {
      case 'float32':
        return Number.isNaN(value) || Math.fround(value) === value;
      case 'float16':
        return Number.isNaN(value) ||
            float16AsUint16ToNumber(toHalf(value)) === value;
      case 'int8':
        return Number.isInteger(value) && value >= -128 && value <= 127;
      case 'uint8':
        return Number.isInteger(value) && value >= 0 && value <= 255;
      case 'int32':
        return Number.isInteger(value) && value >= -2147483648 &&
            value <= 2147483647;
      case 'uint32':
        return Number.isInteger(value) && value >= 0 && value <= 4294967295;
      default:
        return null;
    }
  };
  const summarize = (resources) => {
    const values = asArray(resources.data);
    const dataType = resources.descriptor.dataType;
    let notRepresentable = 0;
    let checked = true;
    for (const value of values) {
      const ok = representable(value, dataType);
      if (ok === null) {
        checked = false;
        break;
      }
      if (!ok) {
        notRepresentable++;
      }
    }
    return {
      dataType,
      count: values.length,
      checked,
      notRepresentable: checked ? notRepresentable : null
    };
  };
  const out = {inputs: {}, expectedOutputs: {}};
  for (const [name, resources] of Object.entries(graph.inputs)) {
    out.inputs[name] = summarize(resources);
  }
  for (const [name, resources] of Object.entries(graph.expectedOutputs)) {
    out.expectedOutputs[name] = summarize(resources);
  }
  return out;
};

// buildAndExecuteGraph may rewrite descriptors (castedType) while building;
// record what the graph resources look like after the run.
const describeOperands = (graph) => {
  const pick = (resources) => ({
    dataType: resources.descriptor.dataType,
    castedType: resources.descriptor.castedType,
    shape: resources.descriptor.shape,
    constant: !!resources.constant
  });
  const out = {inputs: {}, expectedOutputs: {}};
  for (const [name, resources] of Object.entries(graph.inputs)) {
    out.inputs[name] = pick(resources);
  }
  for (const [name, resources] of Object.entries(graph.expectedOutputs)) {
    out.expectedOutputs[name] = pick(resources);
  }
  return out;
};

const storageBits = (value, dataType) => {
  if (dataType === 'float32') {
    return float32Bits(value);
  }
  if (dataType === 'float16') {
    return hex(value, 4);
  }
  return undefined;
};

const dumpElements = (actual, expected, dataType, tolerance) => {
  const elements = [];
  let overBudget = 0;
  let maxDistance = null;
  let maxDistanceIndex = -1;
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i];
    const x = expected[i];
    // Readback of float16 tensors is the Uint16 storage encoding; the
    // expected value is a Number. Report both the decoded value and the bits.
    const actualValue = dataType === 'float16' ? float16AsUint16ToNumber(a) : a;
    const element = {
      i,
      actual: jsonNumber(actualValue),
      expected: jsonNumber(x)
    };
    const actualBits = storageBits(a, dataType);
    if (actualBits !== undefined) {
      element.actualBits = actualBits;
      element.expectedBits = dataType === 'float16' ?
          hex(toHalf(x), 4) : float32Bits(x);
    }
    const eitherNaN = Number.isNaN(Number(actualValue)) || Number.isNaN(x);
    let distance = null;
    if (eitherNaN) {
      // The harness compares the NaN classification instead of a distance.
      element.within = Number.isNaN(Number(actualValue)) === Number.isNaN(x);
    } else if (tolerance.metricType === 'ULP') {
      try {
        distance = ulpDistance(a, x, dataType);
      } catch (e) {
        distance = null;
      }
      element.ulp = jsonNumber(distance);
      element.within = distance === null ? null :
          (typeof distance === 'bigint' ?
               distance <= BigInt(tolerance.value) :
               distance <= Number(tolerance.value));
    } else if (tolerance.metricType === 'ATOL') {
      distance = Math.abs(Number(actualValue) - x);
      element.absoluteDifference = jsonNumber(distance);
      element.within = distance <= Number(tolerance.value);
    } else {
      element.within = null;
    }
    if (element.within === false) {
      overBudget++;
    }
    if (distance !== null && (maxDistance === null || distance > maxDistance)) {
      maxDistance = distance;
      maxDistanceIndex = i;
    }
    elements.push(element);
  }
  return {overBudget, maxDistance, maxDistanceIndex, elements};
};

// Run assertResultsEquals exactly as the harness does, then dump every
// element with the distance the harness would have computed for it.
const compareOutputs =
    (toleranceFunc, result, graph, intermediateOperands) => {
      const out = {};
      const tolerance = toleranceFunc(graph, intermediateOperands);
      out.tolerance = {
        metricType: tolerance.metricType,
        value: jsonNumber(tolerance.value)
      };
      try {
        assertResultsEquals(toleranceFunc, result, graph, intermediateOperands);
        out.harnessVerdict = 'PASS';
      } catch (e) {
        out.harnessVerdict = 'FAIL';
        out.harnessMessage = e.message;
      }
      out.outputs = {};
      for (const name of Object.keys(result)) {
        const expectedOutput = graph.expectedOutputs[name];
        const descriptor = expectedOutput.descriptor;
        const dataType = descriptor.castedType || descriptor.dataType;
        const summary = {
          dataType,
          shape: descriptor.shape,
          length: result[name].length
        };
        if (dataType === 'int4' || dataType === 'uint4') {
          // Packed nybbles; assertResultsEquals unpacks them, this dump does
          // not. The harness verdict above still covers the output.
          summary.elements = null;
          summary.note = 'packed 4-bit output, per-element dump skipped';
        } else {
          let actual = Array.from(result[name]);
          let expected = asArray(expectedOutput.data);
          if (expected.length === 1 && actual.length > 1) {
            // A scalar expected value stands for every element; the harness
            // checks at most kMaximumIndexToValidate of them.
            actual = actual.slice(0, kMaximumIndexToValidate);
            expected = new Array(actual.length).fill(expected[0]);
          }
          summary.expectedLength = expected.length;
          const dump = dumpElements(
              actual, expected.slice(0, actual.length), dataType, tolerance);
          summary.overBudget = dump.overBudget;
          summary.maxDistance = jsonNumber(dump.maxDistance);
          summary.maxDistanceIndex = dump.maxDistanceIndex;
          summary.elements = dump.elements;
        }
        out.outputs[name] = summary;
      }
      return out;
    };

// Probe only: reuse one MLOperand per input name instead of calling
// builder.input() once per reference, which is what createOperand in utils.js
// does. Used when the standard build fails, to tell a rejected duplicate
// input name apart from an unsupported graph.
const sharedInputBuilder = (builder) => {
  const inputs = new Map();
  return new Proxy(builder, {
    get(target, property) {
      if (property === 'input') {
        return (name, descriptor) => {
          if (!inputs.has(name)) {
            inputs.set(name, target.input(name, descriptor));
          }
          return inputs.get(name);
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
};

// Probe only: which MLContextOptions members the implementation reads, and an
// opSupportLimits() fingerprint for the requested device and for every other
// option set. Two option sets with the same fingerprint most likely map to the
// same compute unit, which tells the reader whether a "gpu" divergence is a
// GPU result at all.
const probeContext = async () => {
  const probe = {};
  const readKeys = [];
  const options = {};
  for (const key of ['accelerated', 'deviceType', 'powerPreference']) {
    Object.defineProperty(options, key, {
      enumerable: true,
      get() {
        readKeys.push(key);
        return contextOptions ? contextOptions[key] : undefined;
      }
    });
  }
  const context = await navigator.ml.createContext(options);
  probe.contextOptionsFromUtils = contextOptions;
  probe.optionKeysReadByCreateContext = readKeys;
  probe.contextPrototypeProperties =
      Object.getOwnPropertyNames(Object.getPrototypeOf(context)).sort();
  probe.contextAccelerated =
      'accelerated' in context ? context.accelerated : 'absent';
  probe.contextPowerPreference =
      'powerPreference' in context ? context.powerPreference : 'absent';
  const limits = context.opSupportLimits();
  probe.opSupportLimitsSha256 = await sha256Hex(JSON.stringify(limits));
  probe.opSupportLimits = limits;
  if (typeof context.destroy === 'function') {
    context.destroy();
  }

  const optionSets = {
    empty: {},
    deviceTypeCpu: {deviceType: 'cpu'},
    deviceTypeGpu: {deviceType: 'gpu'},
    deviceTypeNpu: {deviceType: 'npu'},
    acceleratedFalse: {accelerated: false},
    lowPower: {powerPreference: 'low-power'},
    highPerformance: {powerPreference: 'high-performance'}
  };
  probe.otherOptionSets = {};
  for (const [key, set] of Object.entries(optionSets)) {
    try {
      const other = await navigator.ml.createContext(set);
      const otherLimits = other.opSupportLimits();
      probe.otherOptionSets[key] = {
        options: set,
        opSupportLimitsSha256: await sha256Hex(JSON.stringify(otherLimits)),
        preferredInputLayout: otherLimits.preferredInputLayout,
        accelerated: 'accelerated' in other ? other.accelerated : 'absent',
        powerPreference:
            'powerPreference' in other ? other.powerPreference : 'absent'
      };
      if (typeof other.destroy === 'function') {
        other.destroy();
      }
    } catch (e) {
      probe.otherOptionSets[key] = {options: set, error: errorString(e)};
    }
  }
  return probe;
};

const runCandidateTest = async (test) => {
  const entry = {name: test.name};
  entry.required = isMinimumTest(test);
  const checkContext = await getContext();
  entry.supportedByContext =
      validateContextSupportsGraph(checkContext, test.graph);
  entry.wouldRunInHarness = entry.required || entry.supportedByContext;
  entry.harnessSubtestName =
      `${entry.required ? '[required]' : '[optional]'} ${test.name}`;
  entry.transport = checkTransport(test.graph);
  entry.inputs = {};
  for (const [name, resources] of Object.entries(test.graph.inputs)) {
    entry.inputs[name] = asArray(resources.data).map(jsonNumber);
  }
  // buildAndExecuteGraph mutates the graph resources; keep a copy for the
  // fallback probe.
  const pristine = structuredClone(test.graph);
  try {
    const context = await getContext();
    const builder = new MLGraphBuilder(context);
    const {result, intermediateOperands} =
        await capturedCandidate.buildFunc(context, builder, test.graph);
    entry.standard = compareOutputs(
        capturedCandidate.toleranceFunc, result, test.graph,
        intermediateOperands);
  } catch (e) {
    entry.standard = {error: errorString(e)};
  }
  entry.descriptorsAfterStandardRun = describeOperands(test.graph);
  if (entry.standard.error) {
    try {
      const context = await getContext();
      const builder = sharedInputBuilder(new MLGraphBuilder(context));
      const {result, intermediateOperands} =
          await buildAndExecuteGraph(context, builder, pristine);
      entry.probeSharedInputRebuild = compareOutputs(
          capturedCandidate.toleranceFunc, result, pristine,
          intermediateOperands);
    } catch (e) {
      entry.probeSharedInputRebuild = {error: errorString(e)};
    }
  }
  return entry;
};

const summarizeEntry = (entry) => {
  const standard = entry.standard;
  if (standard.error) {
    return `${entry.harnessSubtestName}: ERROR ${standard.error}`;
  }
  const over = Object.entries(standard.outputs)
      .filter(([, output]) => output.overBudget > 0)
      .map(([name, output]) =>
           `${name}: ${output.overBudget} over ${standard.tolerance.value} ` +
           `${standard.tolerance.metricType}, max ${output.maxDistance} ` +
           `at ${output.maxDistanceIndex}`);
  return `${entry.harnessSubtestName}: ${standard.harnessVerdict}` +
      (over.length ? ` (${over.join('; ')})` : '');
};

const saveReport = async (report) => {
  let name = `${dumpFile}__${dumpDevice}`;
  if (dumpLabel) {
    name = `${dumpLabel}__${name}`;
  }
  const response = await fetch(
      'save.py?name=' + encodeURIComponent(name),
      {method: 'POST', body: JSON.stringify(report)});
  const text = await response.text();
  if (response.status === 501) {
    return {saved: false, reason: text};
  }
  assert_true(response.ok, `save.py returned ${response.status}: ${text}`);
  return {saved: true, path: text};
};

const showSummary = (lines) => {
  const pre = document.createElement('pre');
  pre.id = 'candidate-dump-summary';
  pre.textContent = lines.join('\n');
  document.body.appendChild(pre);
};

promise_test(async () => {
  assert_not_equals(navigator.ml, undefined, 'navigator.ml');
  assert_true(
      Object.hasOwn(kContextOptionsForVariant, dumpDevice),
      `?device= must be one of ${
          Object.keys(kContextOptionsForVariant).join(', ')}`);
  assert_true(
      kConformanceFilePattern.test(dumpFile || ''),
      '?file= must be the stem of a file in /webnn/conformance_tests/');
  assert_true(
      dumpLabel === null || kLabelPattern.test(dumpLabel),
      '?label= may only contain letters, digits, "_", "." and "-"');

  await loadScript(`/webnn/conformance_tests/${dumpFile}.https.any.js`);
  assert_not_equals(
      capturedCandidate, null, 'the file called webnn_conformance_test');
  requiredDataTypesAndRanks = await getRequiredDataTypesAndRanks();

  const report = {
    kind: 'webnn candidate dump (diagnostic, not a conformance result)',
    schemaVersion: 1,
    file: dumpFile,
    device: dumpDevice,
    label: dumpLabel,
    href: location.href,
    userAgent: navigator.userAgent,
    userAgentBrands:
        navigator.userAgentData ? navigator.userAgentData.brands : null,
    startedAt: new Date().toISOString(),
    probes: {},
    tests: []
  };
  try {
    report.probes.context = await probeContext();
  } catch (e) {
    report.probes.context = {error: errorString(e)};
  }
  for (const test of capturedCandidate.tests.filter(isTargetTest)) {
    report.tests.push(await runCandidateTest(test));
  }
  report.finishedAt = new Date().toISOString();

  report.save = await saveReport(report);
  // Also reachable from the console as candidateDumpReport.
  window.candidateDumpReport = report;

  const summary = report.tests.map(summarizeEntry);
  const saveLine = report.save.saved ?
      `saved: ${report.save.path}` :
      `not saved: ${report.save.reason}`;
  showSummary([...summary, saveLine]);

  // The status mirrors the harness verdicts so the page reads at a glance;
  // the message carries the summary into any wptreport.
  assert_true(
      report.tests.every(entry => entry.standard.harnessVerdict === 'PASS'),
      `candidate dump: ${summary.join(' | ')} | ${saveLine}`);
}, `candidate dump ${dumpFile} on ${dumpDevice}`);
