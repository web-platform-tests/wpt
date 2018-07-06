// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// https://w3c.github.io/sensors/

'use strict';

function cast(i, t) {
  return Object.assign(Object.create(t.prototype), i);
}

promise_test(async () => {
  const srcs = ['generic-sensor', 'dom', 'html', 'WebIDL'];
  const [generic_sensor, dom, html, idl] = await Promise.all(
    srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  var idl_array = new IdlArray();
  idl_array.add_idls(generic_sensor);
  idl_array.add_dependency_idls(dom);
  idl_array.add_dependency_idls(html);
  idl_array.add_dependency_idls(idl);
  idl_array.add_objects({
    Sensor: ['cast(new Accelerometer(), Sensor)'],
    SensorErrorEvent: [
      'new SensorErrorEvent("error", { error: new DOMException });'
    ],
  });
  idl_array.test();
}, "Test IDL implementation of Generic Sensor");
