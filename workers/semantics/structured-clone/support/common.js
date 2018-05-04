function createWorker(msg) {
  // `type` is defined in the test case itself
  if (type == 'dedicated')
    return new Worker('support/dedicated.js#'+encodeURIComponent(msg));
  else if (type == 'shared')
    return (new SharedWorker('support/shared.js#'+encodeURIComponent(msg))).port;
  else
    assert_unreached('invalid or missing `type`');
}

function check(msg, input, callback, test_obj) {
  if (!test_obj)
    test_obj = async_test(msg);
  test_obj.step(function() {
    var w = createWorker(msg);
    if (typeof input === 'function')
      input = this.step(input);
    w.postMessage(input);
    w.onmessage = this.step_func(function(ev) { callback(ev.data, input, this); });
  });
}

function compare_primitive(actual, input, test_obj) {
  assert_equals(actual, input);
  if (test_obj)
    test_obj.done();
}
function compare_Array(callback, callback_is_async) {
  return function(actual, input, test_obj) {
    if (typeof actual === 'string')
      assert_unreached(actual);
    assert_true(actual instanceof Array, 'instanceof Array');
    assert_not_equals(actual, input);
    assert_equals(actual.length, input.length, 'length');
    callback(actual, input);
    if (test_obj && !callback_is_async)
      test_obj.done();
  }
}

function compare_Object(callback, callback_is_async) {
  return function(actual, input, test_obj) {
    if (typeof actual === 'string')
      assert_unreached(actual);
    assert_true(actual instanceof Object, 'instanceof Object');
    assert_false(actual instanceof Array, 'instanceof Array');
    assert_not_equals(actual, input);
    callback(actual, input);
    if (test_obj && !callback_is_async)
      test_obj.done();
  }
}

function enumerate_props(compare_func, test_obj) {
  return function(actual, input) {
    for (var x in input) {
      compare_func(actual[x], input[x], test_obj);
    }
  };
}

function compare_obj(what) {
  var Type = window[what];
  return function(actual, input, test_obj) {
    if (typeof actual === 'string')
      assert_unreached(actual);
    assert_true(actual instanceof Type, 'instanceof '+what);
    assert_equals(Type(actual), Type(input), 'converted to primitive');
    assert_not_equals(actual, input);
    if (test_obj)
      test_obj.done();
  };
}

function compare_Blob(actual, input, test_obj, expect_File) {
  if (typeof actual === 'string')
    assert_unreached(actual);
  assert_true(actual instanceof Blob, 'instanceof Blob');
  if (!expect_File)
    assert_false(actual instanceof File, 'instanceof File');
  assert_equals(actual.size, input.size, 'size');
  assert_equals(actual.type, input.type, 'type');
  assert_not_equals(actual, input);
  var ev_reader = new FileReader();
  var input_reader = new FileReader();
  var read_count = 0;
  var read_done = test_obj.step_func(function() {
    read_count++;
    if (read_count == 2) {
      var ev_result = ev_reader.result;
      var input_result = input_reader.result;
      assert_equals(ev_result.byteLength, input_result.byteLength, 'byteLength');
      var ev_view = new DataView(ev_result);
      var input_view = new DataView(input_result);
      for (var i = 0; i < ev_result.byteLength; ++i) {
        assert_equals(ev_view.getUint8(i), input_view.getUint8(i), 'getUint8('+i+')');
      }
      if (test_obj)
        test_obj.done();
    }
  });
  var read_error = test_obj.step_func(function() { assert_unreached('FileReader error'); });
  ev_reader.readAsArrayBuffer(actual);
  ev_reader.onload = read_done;
  ev_reader.onabort = ev_reader.onerror = read_error;
  input_reader.readAsArrayBuffer(input);
  input_reader.onload = read_done;
  input_reader.onabort = input_reader.onerror = read_error;
}
