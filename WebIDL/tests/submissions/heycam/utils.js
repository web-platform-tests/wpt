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

function stringifier(interfaceName, w) {
  return operation(interfaceName, "toString", w);
}

function assert_property(object, property, descriptor, description) {
  var desc = Object.getOwnPropertyDescriptor(object, property);
  if ("writable" in descriptor) {
    test(function() {
      assert_equals(desc.writable, descriptor.writable, description + " [[Writable]]");
    }, description + " is " + (descriptor.writable ? "" : "not ") + " writable");
  }
  if ("enumerable" in descriptor) {
    test(function() {
      assert_equals(desc.enumerable, descriptor.enumerable, description + " [[Enumerable]]");
    }, description + " is " + (descriptor.enumerable ? "" : "not ") + " enumerable");
  }
  if ("configurable" in descriptor) {
    test(function() {
      assert_equals(desc.configurable, descriptor.configurable, description + " [[Configurable]]");
    }, description + " is " + (descriptor.configurable ? "" : "not ") + " configurable");
  }
  if ("value" in descriptor) {
    test(function() {
      assert_equals(desc.value, descriptor.value, " [[Value]]");
    }, description + " has the expected value");
  }
}
