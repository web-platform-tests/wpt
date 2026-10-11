// META: title=globalThis.onerror: runtime script errors in ShadowRealm

// https://html.spec.whatwg.org/multipage/#runtime-script-errors says what to do
// for uncaught runtime script errors, and just below describes what to do when
// onerror is a Function.

async_test(t => {
  onerror = t.unreached_func("Window onerror should not be triggered");

  const realm = new ShadowRealm();

  realm.evaluate("var errorCount = 0;");
  realm.evaluate(`(doAsserts) => {
    globalThis.onerror = function(msg, url, lineno, colno, thrownValue) {
      ++errorCount;
      doAsserts(url, lineno, colno, typeof thrownValue, String(thrownValue));
    };
  }`)(t.step_func((url, lineno, typeofThrownValue, stringifiedThrownValue) => {
    assert_equals(url, "eval code", "correct url passed to onerror");
    assert_equals(lineno, 8, "correct line number passed to onerror");
    assert_equals(typeofThrownValue, "string", "thrown string passed directly to onerror");
    assert_equals(stringifiedThrownValue, "bar", "correct thrown value passed to onerror");
  }));

  assert_throws_js(TypeError, () => realm.evaluate(`
    try {
      // This error is caught, so it should NOT trigger onerror.
      throw "foo";
    } catch (ex) {
    }
    // This error is NOT caught, so it should trigger onerror.
    throw "bar";
  `), "thrown error is wrapped in a TypeError object from the surrounding realm");

  t.step_timeout(() => {
    assert_equals(realm.evaluate("errorCount"), 1, "onerror should be called once");
  }, 1000);
}, "onerror triggered by uncaught thrown exception in realm.evaluate");

async_test(t => {
  onerror = t.unreached_func("Window onerror should not be triggered");

  const realm = new ShadowRealm();

  realm.evaluate("var errorCount = 0;");
  realm.evaluate(`(doAsserts) => {
    globalThis.onerror = function(msg, url, lineno, colno, thrownValue) {
      ++errorCount;
      doAsserts(url, lineno, typeof thrownValue, thrownValue instanceof TypeError);
    };
  }`)(t.step_func((url, lineno, typeofThrownValue, isTypeError) => {
    assert_equals(url, "eval code", "correct url passed to onerror");
    assert_equals(lineno, 8, "correct line number passed to onerror");
    assert_equals(typeofThrownValue, "object", "thrown error instance passed to onerror");
    assert_true(isShadowRealmTypeError, "correct thrown value passed to onerror");
  }));

  assert_throws_js(TypeError, () => realm.evaluate(`
    try {
      // This error is caught, so it should NOT trigger onerror.
      window.nonexistentproperty.oops();
    } catch (ex) {
    }
    // This error is NOT caught, so it should trigger onerror.
    window.nonexistentproperty.oops();
  `), "thrown error is wrapped in a TypeError object from the surrounding realm");

  t.step_timeout(() => {
    assert_equals(realm.evaluate("errorCount"), 1, "onerror should be called once");
  }, 1000);
}, "onerror triggered by uncaught runtime error in realm.evaluate");
