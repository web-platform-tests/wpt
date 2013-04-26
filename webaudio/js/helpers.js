function assert_has_property(obj, name, desc) {
  assert_true(undefined != obj[name], desc);
};

function assert_is_method(obj, name, desc) {
  assert_true("function" === typeof obj[name], desc);
};

function assert_defined(obj, desc) {
  assert_true(undefined != obj, desc);
};

// Test the passed in =obj= has the properties and methods to
// implement the AudioParam Interface
// (https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioParam)
function test_implements_audio_param_interface(obj) {
    var properties = ["value", "computedValue", "minValue", "maxValue",
                      "defaultValue"];

    _(properties).forEach(function(property) {
        fn = function () { assert_has_property(obj, property, "has " + property) };
        test(fn, "'" + obj.name + "'" + " implements: " + property);
    });

    var methods = ["setValueAtTime", "linearRampToValueAtTime",
                   "exponentialRampToValueAtTime", "setTargetAtTime",
                   "setValueCurveAtTime", "cancelScheduledValues"];

    _(methods).forEach(function(meth) {
        fn = function () { assert_is_method(obj, meth, "has " + meth + "()") };
        test(fn, "'" + obj.name + "'" + " implements: " + meth + "()");
    });
};


function fuzzyCompare(a, b) {
  return Math.abs(a - b) < 5e-5;
}

function compareBuffers(buf1, buf2,
                        /*optional*/ offset,
                        /*optional*/ length,
                        /*optional*/ sourceOffset,
                        /*optional*/ destOffset) {
  if (length == undefined) {
    length = buf1.length - (offset || 0);
  }
  sourceOffset = sourceOffset || 0;
  destOffset = destOffset || 0;
  var difference = 0;
  var maxDifference = 0;
  var firstBadIndex = -1;
  for (var i = offset || 0; i < Math.min(buf1.length, (offset || 0) + length); ++i) {
    if (!fuzzyCompare(buf1[i + sourceOffset], buf2[i + destOffset])) {
      difference++;
      maxDifference = Math.max(maxDifference, Math.abs(buf1[i + sourceOffset] - buf2[i + destOffset]));
      if (firstBadIndex == -1) {
        firstBadIndex = i;
      }
    }
  };

  return difference == 0;
}
