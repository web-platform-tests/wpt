(function() {
  //inheritance tests
  test(function() {
    var event = new LightLevelEvent('');
    assert_true(event instanceof window.LightLevelEvent);
  }, 'the event is an instance of LightLevelEvent');

  test(function() {
    var event = new LightLevelEvent('');
    assert_true(event instanceof window.Event);
  }, 'the event inherits from Event');

  //type attribute tests
  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent();
    }, 'First argument is required, so was expecting a TypeError.');
  }, 'Missing type argument');

  test(function() {
    var event = new LightLevelEvent(undefined);
    assert_equals(event.type, 'undefined');
  }, 'Event type set to undefined');

  test(function() {
    var event = new LightLevelEvent(null);
    assert_equals(event.type, 'null');
  }, 'type argument is null');

  test(function() {
    var event = new LightLevelEvent(123);
    assert_equals(event.type, '123');
  }, 'type argument is number');

  test(function() {
    var event = new LightLevelEvent(new Number(123));
    assert_equals(event.type, '123');
  }, 'type argument is Number');

  test(function() {
    var event = new LightLevelEvent([]);
    assert_equals(event.type, '');
  }, 'type argument is array');

  test(function() {
    var event = new LightLevelEvent(new Array());
    assert_equals(event.type, '');
  }, 'type argument is instance of Array');

  test(function() {
    var event = new LightLevelEvent(['t', ['e', ['s', ['t']]]]);
    assert_equals(event.type, 't,e,s,t');
  }, 'type argument is nested array');

  test(function() {
    var event = new LightLevelEvent(Math);
    assert_equals(event.type, '[object Math]');
  }, 'type argument is host object');

  test(function() {
    var event = new LightLevelEvent(true);
    assert_equals(event.type, 'true');
  }, 'type argument is boolean (true)');

  test(function() {
    var event = new LightLevelEvent(new Boolean(true));
    assert_equals(event.type, 'true');
  }, 'type argument is instance of Boolean (true)');

  test(function() {
    var event = new LightLevelEvent(false);
    assert_equals(event.type, 'false');
  }, 'type argument is boolean (false)');

  test(function() {
    var event = new LightLevelEvent(new Boolean(false));
    assert_equals(event.type, 'false');
  }, 'type argument is instance of Boolean (false)');

  test(function() {
    var event = new LightLevelEvent('test');
    assert_equals(event.type, 'test');
  }, 'type argument is string');

  test(function() {
    var event = new LightLevelEvent(new String('test'));
    assert_equals(event.type, 'test');
  }, 'type argument is instance of String');

  test(function() {
    var event = new LightLevelEvent(function test() {});
    assert_regexp_match(event.type, /function test.+{\s?}/);
  }, 'type argument is function');

  test(function() {
    var event = new LightLevelEvent({
      toString: function() {
        return '123';
      }
    });
    assert_equals(event.type, '123');
  }, 'type argument is complex object, with toString method');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent({
        toString: function() {
          return function() {}
        }
      });
    });
  }, 'toString is of type function');

  //eventInitDict attribute tests
  test(function() {
    var event = new LightLevelEvent('test', undefined);
    assert_equals(event.value, '');
  }, 'eventInitDict argument set to undefined');

  test(function() {
    var event = new LightLevelEvent('test', null);
    assert_equals(event.value, '');
  }, 'eventInitDict argument is null');

  test(function() {
    var date = new Date();
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', date);
    });
  }, 'eventInitDict argument is Date object');

  test(function() {
    var regexp = /abc/;
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', regexp);
    });
  }, 'eventInitDict argument is RegExp object');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', false);
    });
  }, 'eventInitDict argument is boolean');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', 123);
    });
  }, 'eventInitDict argument is number');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', 'hello');
    });
  }, 'eventInitDict argument is string');

  //test readonly attribute LightLevelState value;
  test(function() {
    var event = new LightLevelEvent('test');
    assert_readonly(event, 'value', 'readonly attribute value');
  }, 'value is readonly');

  test(function() {
    var event = new LightLevelEvent('test');
    assert_equals(event.value, '');
  }, 'value initializes to an empty string');

  test(function() {
    var event = new LightLevelEvent('test', {
      value: ''
    });
    assert_equals(event.value, '');
  }, 'value set to an empty string');

  test(function() {
    var event = new LightLevelEvent('test', {
      value: 'dim'
    });
    assert_equals(event.value, 'dim');
  }, 'value set to dim');

  test(function() {
    var event = new LightLevelEvent('test', {
      value: 'normal'
    });
    assert_equals(event.value, 'normal');
  }, 'value set to normal');

  test(function() {
    var event = new LightLevelEvent('test', {
      value: 'bright'
    });
    assert_equals(event.value, 'bright');
  }, 'value set to bright');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: false
      });
    });
  }, 'value set to false');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: true
      });
    });
  }, 'value set to true');


  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: undefined
      });
    });
  }, 'value set to undefined');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: null
      });
    });
  }, 'value set to null');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: '\U0020'
      });
    });
  }, 'value set to U+0020');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: []
      });
    });
  }, 'value set to []');

  test(function() {
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', {
        value: {}
      });
    });
  }, 'value set to {}');

  test(function() {
    var prop = {
      get value() {
        return NaN;
      }
    };
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', prop);
    });
  }, 'value set to NaN');

  test(function() {
    var prop = {
      get value() {
        return '123';
      }
    };
    assert_throws(new TypeError(), function() {
      new LightLevelEvent('test', prop);
    });
  }, 'value set 123');

  //test attribute EventHandler onlightlevel;
  test(function() {
    var desc = 'window.onlightlevel did not accept callable object',
        desc = 'Expected to find onlightlevel attribute on window object',
        func = function() {};
    assert_idl_attribute(window, 'onlightlevel', descidl);
    window.onlightlevel = func;
    assert_equals(window.onlightlevel, func, desc);
  }, 'expected onlightlevel on window and to be set to function');

  test(function() {
    var desc = 'window.onlightlevel must be null';
    assert_equals(window.onlightlevel, null, desc);
  }, 'onlightlevel is null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable as null';
    window.onlightlevel = function() {};
    window.onlightlevel = {};
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat object as null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable as null';
    window.onlightlevel = function() {};
    window.onlightlevel = {
      call: 'test'
    };
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat object with non-callable call property as null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable (string) as null';
    window.onlightlevel = function() {};
    window.onlightlevel = 'string';
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat string as null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable (number) as null';
    window.onlightlevel = function() {};
    window.onlightlevel = 123;
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat number as null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable (undefined) as null';
    window.onlightlevel = function() {};
    window.onlightlevel = undefined;
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat undefined as null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable (array) as null';
    window.onlightlevel = function() {};
    window.onlightlevel = [];
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat array as null');

  test(function() {
    var desc = 'window.onlightlevel did not treat noncallable host object as null';
    window.onlightlevel = function() {};
    window.onlightlevel = window.Node;
    assert_equals(window.onlightlevel, null, desc);
  }, 'treat non-callable host object as null');

  //Async tests
  var t = async_test('test if LightLevelEvent received');
  window.addEventListener('lightlevel', function(e) {
    t.step(function() {
      var msg = 'expected instance of LightLevelEvent: ';
      assert_true(e instanceof window.LightLevelEvent, msg);
      assert_idl_attribute(e, 'value', 'event has value property');
    });
    t.done();
  });

  var t2 = async_test('test if LightLevelEvent received');
  window.onlightlevel = function(e) {
    t2.step(function() {
      var msg = 'expected instance of LightLevelEvent: ';
      assert_true(e instanceof window.LightLevelEvent, msg);
      assert_idl_attribute(e, 'value', 'event has value property');
    });
    t2.done();
  };
})();
