self.testSettingImmutablePrototype = (prefix, target, originalValue) => {
  test(() => {
    assert_throws(new TypeError, () => {
      Object.setPrototypeOf(target, {});
    });
  }, `${prefix}: setting the prototype via Object.setPrototypeOf should throw a TypeError`);

  test(() => {
    assert_throws(new TypeError, function() {
      target.__proto__ = {};
    });
  }, `${prefix}: setting the prototype via __proto__ should throw a TypeError`);

  test(() => {
    assert_false(Reflect.setPrototypeOf(target, {}));
  }, `${prefix}: setting the prototype via Reflect.setPrototypeOf should return false`);

  const originalValueString = originalValue === null ? "null" : "its original value";

  test(() => {
    assert_equals(Object.getPrototypeOf(target), originalValue);
  }, `${prefix}: the prototype must still be ${originalValueString}`);

  test(() => {
    Object.setPrototypeOf(target, originalValue);
  }, `${prefix}: setting the prototype to ${originalValueString} via Object.setPrototypeOf should not throw`);

  test(() => {
    target.__proto__ = originalValue;
  }, `${prefix}: setting the prototype to ${originalValueString} via __proto__ should not throw`);

  test(() => {
    assert_true(Reflect.setPrototypeOf(target, originalValue));
  }, `${prefix}: setting the prototype to ${originalValueString} via Reflect.setPrototypeOf should return true`);
};
