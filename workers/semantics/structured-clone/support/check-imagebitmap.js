function compare_ArrayBufferView(view) {
  var Type = window[view];
  return function(actual, input, test_obj) {
    if (typeof actual === 'string')
      assert_unreached(actual);
    assert_true(actual instanceof Type, 'instanceof '+view);
    assert_equals(actual.length, input.length, 'length');
    assert_not_equals(actual.buffer, input.buffer, 'buffer');
    for (var i = 0; i < actual.length; ++i) {
      assert_equals(actual[i], input[i], 'actual['+i+']');
    }
    if (test_obj)
      test_obj.done();
  };
}
function compare_ImageData(actual, input, test_obj) {
  if (typeof actual === 'string')
    assert_unreached(actual);
  assert_equals(actual.width, input.width, 'width');
  assert_equals(actual.height, input.height, 'height');
  assert_not_equals(actual.data, input.data, 'data');
  compare_ArrayBufferView('Uint8ClampedArray')(actual.data, input.data, null);
  if (test_obj)
    test_obj.done();
}
function func_ImageData_1x1_transparent_black() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  return ctx.createImageData(1, 1);
}
check('ImageData 1x1 transparent black', func_ImageData_1x1_transparent_black, compare_ImageData);
function func_ImageData_1x1_non_transparent_non_black() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var imagedata = ctx.createImageData(1, 1);
  imagedata.data[0] = 100;
  imagedata.data[1] = 101;
  imagedata.data[2] = 102;
  imagedata.data[3] = 103;
  return imagedata;
}
check('ImageData 1x1 non-transparent non-black', func_ImageData_1x1_non_transparent_non_black, compare_ImageData);
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_ImageData_1x1_transparent_black)], compare_Array(enumerate_props(compare_ImageData)), test_obj);
}, 'Array ImageData object, ImageData 1x1 transparent black');
async_test(function(test_obj) {
  check(test_obj.name, [test_obj.step(func_ImageData_1x1_non_transparent_non_black)], compare_Array(enumerate_props(compare_ImageData)), test_obj);
}, 'Array ImageData object, ImageData 1x1 non-transparent non-black');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_ImageData_1x1_transparent_black)}, compare_Object(enumerate_props(compare_ImageData)), test_obj);
}, 'Object ImageData object, ImageData 1x1 transparent black');
async_test(function(test_obj) {
  check(test_obj.name, {'x':test_obj.step(func_ImageData_1x1_non_transparent_non_black)}, compare_Object(enumerate_props(compare_ImageData)), test_obj);
}, 'Object ImageData object, ImageData 1x1 non-transparent non-black');

function compare_ImageBitmap(actual, input, test_obj) {
  if (typeof actual === 'string')
    assert_unreached(actual);
  assert_equals(actual instanceof ImageBitmap, 'instanceof ImageBitmap');
  assert_not_equals(actual, input);
  // XXX paint the ImageBitmap on a canvas and check the data
  if (test_obj)
    test_obj.done();
}
function get_canvas_1x1_transparent_black() {
  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
}
async_test(function(test_obj) {
  var canvas = get_canvas_1x1_transparent_black();
  createImageBitmap(canvas, function(image) { check(test_obj.name, image, compare_ImageBitmap, test_obj); });
}, 'ImageBitmap 1x1 transparent black');
function get_canvas_1x1_non_transparent_non_black() {
  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  var ctx = canvas.getContext('2d');
  var imagedata = ctx.getImageData(0, 0, 1, 1);
  imagedata.data[0] = 100;
  imagedata.data[1] = 101;
  imagedata.data[2] = 102;
  imagedata.data[3] = 103;
  return canvas;
}
async_test(function(test_obj) {
  var canvas = get_canvas_1x1_non_transparent_non_black();
  createImageBitmap(canvas, function(image) { check(test_obj.name, image, compare_ImageBitmap, test_obj); });
}, 'ImageBitmap 1x1 non-transparent non-black');

async_test(function(test_obj) {
  var canvas = get_canvas_1x1_transparent_black();
  createImageBitmap(canvas, function(image) { check(test_obj.name, [image], compare_Array(enumerate_props(compare_ImageBitmap)), test_obj); });
}, 'Array ImageBitmap object, ImageBitmap 1x1 transparent black');
async_test(function(test_obj) {
  var canvas = get_canvas_1x1_non_transparent_non_black();
  createImageBitmap(canvas, function(image) { check(test_obj.name, [image], compare_Array(enumerate_props(compare_ImageBitmap)), test_obj); });
}, 'Array ImageBitmap object, ImageBitmap 1x1 non-transparent non-black');

async_test(function(test_obj) {
  var canvas = get_canvas_1x1_transparent_black();
  createImageBitmap(canvas, function(image) { check(test_obj.name, {'x':image}, compare_Object(enumerate_props(compare_ImageBitmap)), test_obj); });
}, 'Object ImageBitmap object, ImageBitmap 1x1 transparent black');
async_test(function(test_obj) {
  var canvas = get_canvas_1x1_non_transparent_non_black();
  createImageBitmap(canvas, function(image) { check(test_obj.name, {'x':image}, compare_Object(enumerate_props(compare_ImageBitmap)), test_obj); });
}, 'Object ImageBitmap object, ImageBitmap 1x1 non-transparent non-black');
