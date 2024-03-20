// Utility functions for Web IDL tests.

function interfaceObject(interfaceName, w) {
  return function() { return (w || window)[interfaceName]; }
}

function interfacePrototypeObject(interfaceName, w) {
  return function() { return (w || window)[interfaceName].prototype; }
}

function namedConstructorObject(constructorName, w) {
  return function() { return (w || window)[constructorName]; }
}

function getter(interfaceName, attributeName, w) {
  return function() { return Object.getOwnPropertyDescriptor((w || window)[interfaceName].prototype, attributeName).get; }
}

function setter(interfaceName, attributeName, w) {
  return function() { return Object.getOwnPropertyDescriptor((w || window)[interfaceName].prototype, attributeName).set; }
}

function operation(interfaceName, operationName, w) {
  return function() { return Object.getOwnPropertyDescriptor((w || window)[interfaceName].prototype, operationName).value; }
}

function staticOperation(interfaceName, operationName, w) {
  return function() { return Object.getOwnPropertyDescriptor((w || window)[interfaceName], operationName).value; }
}

function stringifier(interfaceName, w) {
  return operation(interfaceName, "toString", w);
}

function assert_descriptor(desc1, desc2, description) {
  description = description || "property";
  assert_true(!!desc1, description + " exists");
  if ("value" in desc2) {
    assert_equals(desc1.value, desc2.value, description + " [[Value]]");
  }
  if ("writable" in desc2) {
    assert_equals(desc1.writable, desc2.writable, description + " [[Writable]]");
  }
  if ("enumerable" in desc2) {
    assert_equals(desc1.enumerable, desc2.enumerable, description + " [[Enumerable]]");
  }
  if ("configurable" in desc2) {
    assert_equals(desc1.configurable, desc2.configurable, description + " [[Configurable]]");
  }
}

function assert_property(object, property, desc, description) {
  assert_descriptor(Object.getOwnPropertyDescriptor(object, property), desc, description);
}

function prototypeChain(o) {
  var a = [];
  do {
    a.push(o);
    o = Object.getPrototypeOf(o);
  } while (o);
  return a;
}

function interfaceMemberHome(intf) {
  if (intf == 'Window') {
    return window;
  }
  return window[intf].prototype;
}

function interfaceMemberHomeName(intf) {
  if (intf == 'Window') {
    return "window instance";
  }
  return intf + ".prototype";
}
