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
