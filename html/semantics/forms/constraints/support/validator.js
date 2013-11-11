var validator = {
  test_tooLong: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);

      if (data.dirty) {
        ctl.focus();
        ctl.value += "a";
        ctl.setSelectionRange(ctl.value.length, ctl.value.length);
        document.execCommand("Delete"); //simulate the user interaction
      }

      if (data.expected)
        assert_true(ctl.validity.tooLong, "The validity.tooLong should be true.");
      else
        assert_false(ctl.validity.tooLong, "The validity.tooLong should be false.");
    }, data.name);
  },

  test_patternMismatch: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);

      if (data.expected)
        assert_true(ctl.validity.patternMismatch, "The validity.patternMismatch should be true.");
      else
        assert_false(ctl.validity.patternMismatch, "The validity.patternMismatch should be false.");
    }, data.name);
  },

  test_valueMissing: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);
      if (data.expected)
        assert_true(ctl.validity.valueMissing, "The validity.valueMissing should be true.");
      else
        assert_false(ctl.validity.valueMissing, "The validity.valueMissing should be false.");
    }, data.name);
  },

  test_typeMismatch: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);

      if (data.expected)
        assert_true(ctl.validity.typeMismatch, "The validity.typeMismatch should be true.");
      else
        assert_false(ctl.validity.typeMismatch, "The validity.typeMismatch should be false.");
    }, data.name);
  },

  test_rangeOverflow: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);

      if (data.expected)
        assert_true(ctl.validity.rangeOverflow, "The validity.rangeOverflow should be true.");
      else
        assert_false(ctl.validity.rangeOverflow, "The validity.rangeOverflow should be false.");
    }, data.name);
  },

  test_rangeUnderflow: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);
      if (data.expected)
        assert_true(ctl.validity.rangeUnderflow, "The validity.rangeUnderflow should be true.");
      else
        assert_false(ctl.validity.rangeUnderflow, "The validity.rangeUnderflow should be false.");
    }, data.name);
  },

  test_stepMismatch: function(ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);

      if (data.expected) {
        assert_true(ctl.validity.stepMismatch, "The validity.stepMismatch should be true.");
      } else {
        assert_false(ctl.validity.stepMismatch, "The validity.stepMismatch should be false.");
      }
    }, data.name);
  },

  //ToDo: unspportted on most browsers
  test_badInput: function(ctl, data) {
  },

  test_willValidate: function(ctl, data) {
    if (ctl.type === "hidden" || ctl.type === "reset" || ctl.type === "button"
        || ctl.tagName === "KEYGEN" || ctl.tagName === "OBJECT") {
      var tmp = ctl.type ? "in "+ ctl.type +" status" : "";
      test (function () {
        assert_false(ctl.willValidate, "The element.willValidate should be false.");
      }, data.name + "Must be barred from constraint validation");
    } else {
      test (function () {
        assert_true(ctl.willValidate, "The element.willValidate should be true.");
      },  data.name + "The willValidate attribute must be true if it is mutable");

      //If an element is disabled, it is barred from constraint validation.
      test (function () {
        ctl.disabled = true;
        assert_false(ctl.willValidate, "The element.willValidate should be false.");
        ctl.disabled = false;
      }, data.name + "Must be barred from constraint validation if it is disabled");

      test (function () {
        //If the readonly attribute is specified on an INPUT element, the element is barred from constraint validation.
        if (ctl.tagName == "INPUT" || ctl.tagName == "TEXTAREA") {
          ctl.readOnly = true;
          assert_false(ctl.willValidate, "The element.willValidate should be false.");
          ctl.readOnly = false;
        }
      }, data.name + "Must be barred from constraint validation if it is readonly");

      test (function () {
        //If an element has a datalist element ancestor, it is barred from constraint validation.
        var dl = document.createElement("datalist");
        dl.appendChild(ctl);
        assert_false(ctl.willValidate, "The element.willValidate should be false.");
      }, data.name + "Must be barred from constraint validation if it is a child of datalist");
    }
  },

  test_isValid: function (ctl, data) {
    var self = this;
    test(function () {
      self.set_conditions(ctl, data.conditions);

      if (data.dirty) {
        ctl.focus();
        ctl.value += "a";
        ctl.setSelectionRange(ctl.value.length, ctl.value.length);
        document.execCommand("Delete"); //simulate the user interaction
      }

      if (data.expected) {
        assert_true(ctl.validity.valid, "The validity.valid should be true.");
      } else {
        assert_false(ctl.validity.valid, "The validity.valid should be false.");
      }
    }, data.name);
  },

  test_support_type: function (ctl, typ, testName) {
    test(function () {
      assert_equals(ctl.type, typ, "The " + typ + " type should be supported.");
    }, testName);
  },

  set_conditions: function (ctl, obj) {
    for (var attr in obj) {
      ctl[attr] = null;
      ctl.removeAttribute(attr);
      ctl[attr] = obj[attr];
      if ((attr == "pattern" || attr == "multiple") && ( !obj[attr] )) {
        ctl.removeAttribute("pattern");
      }
    }
  },

  run_test: function (testee, method) {
    var testMethod = "test_" + method;
    if (typeof this[testMethod] !== "function") {
      // console.error("The " + method + " test is not defined.");
      return false;
    };

    var ele = null,
        prefix = "";

    for (var i = 0; i < testee.length; i++) {
      if (testee[i].types.length > 0) {
        for (var typ in testee[i].types) {
          ele = document.createElement(testee[i].tag);
          document.forms.fm.appendChild(ele);

          try {
            ele.type = testee[i].types[typ];
          } catch (e) {
            //Do nothing, avoid the runtime error breaking the test
          }

          prefix = "[" + testee[i].tag.toUpperCase() + " in " + testee[i].types[typ].toUpperCase() + " status] ";
          if (ele.type != testee[i].types[typ]) {
            this.test_support_type(
              ele,
              testee[i].types[typ],
              prefix + "The " + testee[i].types[typ].toUpperCase() + " type must be suppoorted."
            );
            continue;
          }

          if (testee[i].checkPoints) {
            for (var j = 0; j < testee[i].checkPoints.length; j++) {
              testee[i].testData[j].name = testee[i].testData[j].name.replace(/\[.*\]\s/g, prefix);
              this[testMethod](ele, testee[i].testData[j]);
            }
          } else {
            for (var item in testee[i].testData) {
              testee[i].testData[item].name = testee[i].testData[item].name.replace(/\[.*\]\s/g, prefix);
              this[testMethod](ele, testee[i].testData[item]);
            }
          }
        }
      } else {
        ele = document.createElement(testee[i].tag);
        document.forms.fm.appendChild(ele); 
        prefix = "[" + testee[i].tag + "] ";

        if (testElements[i].tag === "select") {
          ele.add(new Option("test1", ""));
          ele.add(new Option("test2", 1));
        }

        for (var item in testee[i].testData) {
          prefix = "[" + testee[i].tag + "] ";
          testee[i].testData[item].name = testee[i].testData[item].name.replace(/\[.*\]\s/g, prefix);
          this[testMethod](ele, testee[i].testData[item]);
        }
      }
    }
  }
}
