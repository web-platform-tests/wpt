/**
 * W3C 3-clause BSD License
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 * o Redistributions of works must retain the original copyright notice,
 *     this list of conditions and the following disclaimer.
 *
 * o Redistributions in binary form must reproduce the original copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * o Neither the name of the W3C nor the names of its contributors may be
 *     used to endorse or promote products derived from this work without
 *     specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 **/

 (function() {
  //inheritance tests
  test(function() {
    var event = new DeviceLightEvent('');
    assert_true(event instanceof window.DeviceLightEvent);
  }, 'the event is an instance of DeviceLightEvent');

  test(function() {
    var event = new DeviceLightEvent('');
    assert_true(event instanceof window.Event);
  }, 'the event inherits from Event');

  //Type attribute tests
  test(function() {
    assert_throws(null, function() {
      new DeviceLightEvent();
    }, 'First argument is required, so was expecting a TypeError.');
  }, 'Missing type argument');

  test(function() {
    var event = new DeviceLightEvent(undefined);
    assert_equals(event.type, 'undefined');
  }, 'Event type set to undefined');

  test(function() {
    var event = new DeviceLightEvent(null);
    assert_equals(event.type, 'null');
  }, 'type argument is null');

  test(function() {
    var event = new DeviceLightEvent(123);
    assert_equals(event.type, '123');
  }, 'type argument is number');

  test(function() {
    var event = new DeviceLightEvent(new Number(123));
    assert_equals(event.type, '123');
  }, 'type argument is Number');

  test(function() {
    var event = new DeviceLightEvent([]);
    assert_equals(event.type, '');
  }, 'type argument is array');

  test(function() {
    var event = new DeviceLightEvent(new Array());
    assert_equals(event.type, '');
  }, 'type argument is instance of Array');

  test(function() {
    var event = new DeviceLightEvent(['t', ['e', ['s', ['t']]]]);
    assert_equals(event.type, 't,e,s,t');
  }, 'type argument is nested array');

  test(function() {
    var event = new DeviceLightEvent(Math);
    assert_equals(event.type, '[object Math]');
  }, 'type argument is host object');

  test(function() {
    var event = new DeviceLightEvent(true);
    assert_equals(event.type, 'true');
  }, 'type argument is boolean (true)');

  test(function() {
    var event = new DeviceLightEvent(new Boolean(true));
    assert_equals(event.type, 'true');
  }, 'type argument is instance of boolean');

  test(function() {
    var event = new DeviceLightEvent(false);
    assert_equals(event.type, 'false');
  }, 'type argument is boolean (false)');

  test(function() {
    var event = new DeviceLightEvent(new Boolean(false));
    assert_equals(event.type, 'false');
  }, '');

  test(function() {
    var event = new DeviceLightEvent('test');
    assert_equals(event.type, 'test');
  }, 'type argument is instance of boolean (false)');

  test(function() {
    var event = new DeviceLightEvent(new String('test'));
    assert_equals(event.type, 'test');
  }, 'type argument is string');

  test(function() {
    var event = new DeviceLightEvent(function test() {});
    assert_regexp_match(event.type, /function test.+{\s?}/);
  }, 'type argument is function');

  test(function() {
    var event = new DeviceLightEvent({
      toString: function() {
        return '123';
      }
    });
    assert_equals(event.type, '123');
  }, 'type argument is complext object, with toString method');

  test(function() {
    assert_throws(null, function() {
      new DeviceLightEvent({
        toString: function() {
          return function() {}
        }
      });
    });
  }, 'toString is of type function');

  //test readonly attribute double value;
  test(function() {
    var event = new DeviceLightEvent('test');
    assert_readonly(event, 'value', 'readonly attribute value');
  }, 'value is readonly');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: false
    });
    assert_equals(event.value, 0, 'value set to false, converts to 0.');
  }, 'value set to false');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: true
    });
    assert_equals(event.value, 1, 'value set to true, converts to 1.');
  }, 'value set to true');


  test(function() {
    var prop = {
      value: undefined
    };
    assert_throws(null, function() {
      new DeviceLightEvent('test', prop);
    }, 'value of undefined resolves to NaN, expected type error.');
  }, 'value of undefined resolves to NaN, expected type error.');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: null
    });
    assert_equals(event.value, 0, 'value resolves to 0');
  }, 'value resolves to 0');


  test(function() {
    var event = new DeviceLightEvent('test', {
      value: ''
    });
    assert_equals(event.value, 0, 'value must resolve to 0');
  }, 'value must resolve to 0');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: '\u0020'
    });
    assert_equals(event.value, 0, 'value must resolve to 0');
  }, 'value must resolve to 0');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: '\u0020\u0020\u0020\u0020\u0020\u0020'
    });
    assert_equals(event.value, 0, 'value must resolve to 0');
  }, 'value must resolve to 0');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: '\u0020\u0020\u00201234\u0020\u0020\u0020'
    });
    assert_equals(event.value, 1234, 'converts to 1234');
  }, 'converts to 1234');

  test(function() {
    var event = new DeviceLightEvent('test', {
      value: []
    });
    assert_equals(event.value, 0, 'converts to 0');
  }, 'converts to 0');


  test(function() {
    var prop = {
      value: {}
    };
    assert_throws(null, function() {
      new DeviceLightEvent('test', prop);
    }, 'value of {} resolves to NaN');
  }, 'value of {} resolves to NaN, expected type error');

  test(function() {
    var prop = {
      get value() {
        return NaN;
      }
    };
    assert_throws(null, function() {
      new DeviceLightEvent('test', prop);
    }, 'value resolves to NaN');
  }, 'value resolves to NaN, expected type error');

  test(function() {
    var prop = {
      get value() {
        return '123';
      }
    };
    var event = new DeviceLightEvent('test', prop);
    assert_equals(event.value, 123, 'converts to 123');
  }, 'value resolves 123');

  test(function() {
    var desc = 'Expected to find ondevicelight attribute on window object';
    assert_idl_attribute(window, 'ondevicelight', desc);
  }, 'ondevicelight event hander attr must be on window object.');

  test(function() {
    var desc = 'window.ondevicelight must be null';
    assert_equals(window.ondevicelight, null, desc);
  }, 'ondevicelight is null');

  test(function() {
    var desc = 'window.ondevicelight did not accept callable object',
      func = function() {},
      desc = 'Expected to find ondevicelight attribute on window object';
    assert_idl_attribute(window, 'ondevicelight', desc);
    window.ondevicelight = func;
    assert_equals(window.ondevicelight, func, desc);
  }, 'expected ondevicelight on window and to be set to function');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable as null';
    window.ondevicelight = function() {};
    window.ondevicelight = {};
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat object as null');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable as null';
    window.ondevicelight = function() {};
    window.ondevicelight = {
      call: 'test'
    };
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat object with non-callable call property as null');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable (string) as null';
    window.ondevicelight = function() {};
    window.ondevicelight = 'string';
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat string as null');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable (number) as null';
    window.ondevicelight = function() {};
    window.ondevicelight = 123;
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat number as null');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable (undefined) as null';
    window.ondevicelight = function() {};
    window.ondevicelight = undefined;
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat undefined as null');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable (array) as null';
    window.ondevicelight = function() {};
    window.ondevicelight = [];
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat array as null');

  test(function() {
    var desc = 'window.ondevicelight did not treat noncallable host object as null';
    window.ondevicelight = function() {};
    window.ondevicelight = window.Node;
    assert_equals(window.ondevicelight, null, desc);
  }, 'treat non-callable host object as null');

  //Async tests
  var t = async_test('test if DeviceLightEvent recieved');
  window.addEventListener('devicelight', function(e) {
    t.step(function() {
      var msg = 'expected instance of DeviceLightEvent: ';
      assert_true(e instanceof window.DeviceLightEvent, msg);
      assert_idl_attribute(e, 'value', 'event has value property');
    });
    t.done();
  });

  var t2 = async_test('test if DeviceLightEvent recieved');
  window.ondevicelight = function(e) {
    t2.step(function() {
      var msg = 'expected instance of DeviceLightEvent: ';
      assert_true(e instanceof window.DeviceLightEvent, msg);
      assert_idl_attribute(e, 'value', 'event has value property');
    });
    t2.done();
  };
})();
