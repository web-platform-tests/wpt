var validator = new Object();
validator = {
  test_tooLong: function(ctl, len, value, expected, testName, isDirty) {
    test(function () {
      validator.set_conditions(ctl, {maxLength: len, value: value});

      if (isDirty) {
        ctl.value += "a";
        ctl.setSelectionRange(ctl.value.length, ctl.value.length);
        document.execCommand("Delete", true, null); //simulate the user interaction
      }

      if (expected)
        assert_true(ctl.validity.tooLong, "The validity.tooLong should be true.");
      else
        assert_false(ctl.validity.tooLong, "The validity.tooLong should be false.");
    }, testName);
  },

  test_patternMismatch: function(ctl, pattern, value, expected, testName) {
    test(function () {
      validator.set_conditions(ctl, {pattern: pattern, value: value});
      if (expected)
        assert_true(ctl.validity.patternMismatch, "The validity.patternMismatch should be true.");
      else
        assert_false(ctl.validity.patternMismatch, "The validity.patternMismatch should be false.");
    }, testName);
  },

  test_valueMissing: function(ctl, required, value, expected, testName) {
    test(function () {
      if (ctl.type == "checkbox" || ctl.type == "radio") {
        validator.set_conditions(ctl, {required: !!required, checked: value, name: "test"+ctl.type});
      } else if(ctl.type == "file") {
        validator.set_conditions(ctl, {required: !!required, files: value, name: "test"+ctl.type});
      } else  {
        validator.set_conditions(ctl, {required: !!required, value: value, name: "test"+ctl.type});
      }
      if (expected)
        assert_true(ctl.validity.valueMissing, "The validity.valueMissing should be true.");
      else
        assert_false(ctl.validity.valueMissing, "The validity.valueMissing should be false.");
    }, testName);
  },

  test_typeMismatch: function(ctl, multiple, value, expected, testName) {
    test(function () {
      validator.set_conditions(ctl, {multiple: multiple, value: value});
      if (expected)
        assert_true(ctl.validity.typeMismatch, "The validity.typeMismatch should be true.");
      else
        assert_false(ctl.validity.typeMismatch, "The validity.typeMismatch should be false.");
    }, testName);  
  },

  test_rangeOverflow: function(ctl, max, value, expected, testName) {
    test(function () {
      ctl.max = null;
      ctl.removeAttribute("max");
      validator.set_conditions(ctl, {value: value, max: max});
      if (expected)
        assert_true(ctl.validity.rangeOverflow, "The validity.rangeOverflow should be true.");
      else
        assert_false(ctl.validity.rangeOverflow, "The validity.rangeOverflow should be false.");
    }, testName);
  },

  test_rangeUnderflow: function(ctl, min, value, expected, testName) {
    test(function () {
      ctl.min = null;
      ctl.removeAttribute("min");
      validator.set_conditions(ctl, {value: value, min: min});
      if (expected)
        assert_true(ctl.validity.rangeUnderflow, "The validity.rangeUnderflow should be true.");
      else
        assert_false(ctl.validity.rangeUnderflow, "The validity.rangeUnderflow should be false.");
    }, testName);
  },

  test_stepMismatch: function(ctl, step, value, expected, testName) {
    ctl.step = "";
    ctl.value = value;
    ctl.step = step;

    test(function () {
      if (expected) {
        assert_true(ctl.validity.stepMismatch, "The validity.stepMismatch should be true.");
      } else {
        assert_false(ctl.validity.stepMismatch, "The validity.stepMismatch should be false.");
      }
    }, testName);
  },

  //ToDo: unspportted on most browsers
  test_badInput: function(ctl, value, expected, testName) {
  },

  test_willValidate: function(ctl, testName) {
    if (ctl.type == "hidden" || ctl.type == "reset" || ctl.type == "button" || ctl.tagName == "KEYGEN" || ctl.tagName == "OBJECT") {
      var tmp = ctl.type ? "in "+ ctl.type +" status" : "";
      test (function () {
        assert_false(ctl.willValidate, "The element.willValidate should be false.");
      }, testName + "Must be barred from constraint validation");
    } else {
      test (function () {
        assert_true(ctl.willValidate, "The element.willValidate should be true.");
      },  testName + "The willValidate attribute must be true if it is mutable");

      //If an element is disabled, it is barred from constraint validation.
      test (function () {
        ctl.disabled = true;
        assert_false(ctl.willValidate, "The element.willValidate should be false.");
        ctl.disabled = false;
      }, testName + "Must be barred from constraint validation if it is disabled");

      test (function () {
        //If the readonly attribute is specified on an INPUT element, the element is barred from constraint validation.
        if (ctl.tagName == "INPUT" || ctl.tagName == "TEXTAREA") {
          ctl.readOnly = true;
          assert_false(ctl.willValidate, "The element.willValidate should be false.");
          ctl.readOnly = false;
        }
      }, testName + "Must be barred from constraint validation if it is readonly");

      test (function () {
        //If an element has a datalist element ancestor, it is barred from constraint validation.
        var dl = document.createElement("datalist");
        dl.appendChild(ctl);
        assert_false(ctl.willValidate, "The element.willValidate should be false.");
      }, testName + "Must be barred from constraint validation if it is a child of datalist");
    }
  },

  test_isValid: function (ctl, expected, testName) {    
    test(function () {
      if (expected) {
        assert_true(ctl.validity.valid, "The validity.valid should be true.");
      } else {
        assert_false(ctl.validity.valid, "The validity.valid should be false.");
      }
    }, testName);
  },

  test_support_type: function (ctl, typ, testName) {
    test(function () {
      assert_equals(ctl.type, typ, "The " + typ + " type should be supported.");
    }, testName);
  },
  
  set_conditions: function (ctl, obj) {
    for (var attr in obj) {
      ctl[attr] = obj[attr];
      if ((attr == "pattern" || attr == "multiple") && ( !obj[attr] )) {
          ctl.removeAttribute("pattern");
      }
    }
  }
}