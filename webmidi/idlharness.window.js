// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://webaudio.github.io/web-midi-api/

'use strict';

let access, inputs, input, outputs, output;
promise_test(async () => {
  const srcs = ['webmidi', 'html', 'dom'];
  const [idl, html, dom] = await Promise.all(
    srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  const idl_array = new IdlArray();
  idl_array.add_idls(idl);
  idl_array.add_dependency_idls(html);
  idl_array.add_dependency_idls(dom);

  try {
    access = await navigator.requestMIDIAccess();
    inputs = access.inputs;
    if (inputs.size) {
      input = Array.from(access.inputs.values())[0];
    }
    outputs = access.outputs;
    if (outputs.size) {
      output = Array.from(access.outputs.values())[0];
    }
  } catch (e) {
    // Will be surfaces by idlharness.js's test_object below.
  }

  idl_array.add_objects({
    MIDIAccess: ['access'],
    MIDIInputMap: ['inputs'],
    MIDIInput: ['input'],
    MIDIOutputMap: ['outputs'],
    MIDIOutput: ['output'],
    MIDIConnectionEvent: ['new MIDIConnectionEvent("type")'],
  })
  idl_array.test();
}, 'webmidi interfaces');
