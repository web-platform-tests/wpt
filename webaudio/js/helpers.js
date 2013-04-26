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
