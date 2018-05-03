function func_Blob_basic() {
  return new Blob(['foo'], {type:'text/x-bar'});
}
check('Blob basic', func_Blob_basic, compare_Blob);

function b(str) {
  return parseInt(str, 2);
}
function encode_cesu8(codeunits) {
  // http://www.unicode.org/reports/tr26/ section 2.2
  // only the 3-byte form is supported
  var rv = [];
  codeunits.forEach(function(codeunit) {
    rv.push(b('11100000') + ((codeunit & b('1111000000000000')) >> 12));
    rv.push(b('10000000') + ((codeunit & b('0000111111000000')) >> 6));
    rv.push(b('10000000') +  (codeunit & b('0000000000111111')));
  });
  return rv;
}
function func_Blob_bytes(arr) {
  return function() {
    var buffer = new ArrayBuffer(arr.length);
    var view = new DataView(buffer);
    for (var i = 0; i < arr.length; ++i) {
      view.setUint8(i, arr[i]);
    }
    return new Blob([view]);
  };
}
check('Blob unpaired high surrogate (invalid utf-8)', func_Blob_bytes(encode_cesu8([0xD800])), compare_Blob);
check('Blob unpaired low surrogate (invalid utf-8)', func_Blob_bytes(encode_cesu8([0xDC00])), compare_Blob);
check('Blob paired surrogates (invalid utf-8)', func_Blob_bytes(encode_cesu8([0xD800, 0xDC00])), compare_Blob);

function func_Blob_empty() {
  return new Blob(['']);
}
check('Blob empty', func_Blob_empty , compare_Blob);
function func_Blob_NUL() {
  return new Blob(['\u0000']);
}
check('Blob NUL', func_Blob_NUL, compare_Blob);

async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_Blob_basic)], compare_Array(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Array Blob object, Blob basic');
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_Blob_bytes([0xD800]))], compare_Array(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Array Blob object, Blob unpaired high surrogate (invalid utf-8)');
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_Blob_bytes([0xDC00]))], compare_Array(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Array Blob object, Blob unpaired low surrogate (invalid utf-8)');
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_Blob_bytes([0xD800, 0xDC00]))], compare_Array(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Array Blob object, Blob paired surrogates (invalid utf-8)');
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_Blob_empty)], compare_Array(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Array Blob object, Blob empty');
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_Blob_NUL)], compare_Array(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Array Blob object, Blob NUL');

async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_Blob_basic)}, compare_Object(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Object Blob object, Blob basic');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_Blob_bytes([0xD800]))}, compare_Object(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Object Blob object, Blob unpaired high surrogate (invalid utf-8)');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_Blob_bytes([0xDC00]))}, compare_Object(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Object Blob object, Blob unpaired low surrogate (invalid utf-8)');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_Blob_bytes([0xD800, 0xDC00]))}, compare_Object(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Object Blob object, Blob paired surrogates (invalid utf-8)');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_Blob_empty)}, compare_Object(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Object Blob object, Blob empty');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_Blob_NUL)}, compare_Object(enumerate_props(compare_Blob, test_obj), true), test_obj);
}, 'Object Blob object, Blob NUL');
