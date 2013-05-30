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
        var event = new DeviceProximityEvent('');
        assert_true(event instanceof window.DeviceProximityEvent);
    }, 'the event is an instance of DeviceProximityEvent');

    test(function() {
        var event = new DeviceProximityEvent('');
        assert_true(event instanceof window.Event);
    }, 'the event inherits from Event');

    //Type attribute tests
    test(function() {
        assert_throws(null, function() {
            new DeviceProximityEvent();
        }, 'First argument is required, so was expecting a TypeError.');
    }, 'Missing type argument');

    test(function() {
        var event = new DeviceProximityEvent(undefined);
        assert_equals(event.type, 'undefined');
    }, 'Event type set to undefined');

    test(function() {
        var event = new DeviceProximityEvent(null);
        assert_equals(event.type, 'null');
    }, 'type argument is null');

    test(function() {
        var event = new DeviceProximityEvent(123);
        assert_equals(event.type, '123');
    }, 'type argument is number');

    test(function() {
        var event = new DeviceProximityEvent(new Number(123));
        assert_equals(event.type, '123');
    }, 'type argument is Number');

    test(function() {
        var event = new DeviceProximityEvent([]);
        assert_equals(event.type, '');
    }, 'type argument is array');

    test(function() {
        var event = new DeviceProximityEvent(new Array());
        assert_equals(event.type, '');
    }, 'type argument is instance of Array');

    test(function() {
        var event = new DeviceProximityEvent(['t', ['e', ['s', ['t']]]]);
        assert_equals(event.type, 't,e,s,t');
    }, 'type argument is nested array');

    test(function() {
        var event = new DeviceProximityEvent(Math);
        assert_equals(event.type, '[object Math]');
    }, 'type argument is host object');

    test(function() {
        var event = new DeviceProximityEvent(true);
        assert_equals(event.type, 'true');
    }, 'type argument is boolean (true)');

    test(function() {
        var event = new DeviceProximityEvent(new Boolean(true));
        assert_equals(event.type, 'true');
    }, 'type argument is instance of boolean');

    test(function() {
        var event = new DeviceProximityEvent(false);
        assert_equals(event.type, 'false');
    }, 'type argument is boolean (false)');

    test(function() {
        var event = new DeviceProximityEvent(new Boolean(false));
        assert_equals(event.type, 'false');
    }, '');

    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_equals(event.type, 'test');
    }, 'type argument is instance of boolean (false)');

    test(function() {
        var event = new DeviceProximityEvent(new String('test'));
        assert_equals(event.type, 'test');
    }, 'type argument is string');

    test(function() {
        var event = new DeviceProximityEvent(function test() {});
        assert_regexp_match(event.type, /function test.+{\s?}/);
    }, 'type argument is function');

    test(function() {
        var event = new DeviceProximityEvent({
            toString: function() {
                return '123';
            }
        });
        assert_equals(event.type, '123');
    }, 'type argument is complext object, with toString method');

    test(function() {
        assert_throws(null, function() {
            new DeviceProximityEvent({
                toString: function() {
                    return function() {}
                }
            });
        });
    }, 'toString is of type function');

    //test the attributes exist
    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_idl_attribute(event, 'value', 'must have attribute value');
    }, 'value attribute exist');

    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_idl_attribute(event, 'min', 'must have attribute min');
    }, 'min attribute exist');

    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_idl_attribute(event, 'max', 'must have attribute max');
    }, 'max attribute exist');

    //test readonly attribute double value;
    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_readonly(event, 'value', 'readonly attribute value');
    }, 'value attribute is readonly');

    //test readonly attribute double min
    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_readonly(event, 'min', 'readonly attribute min');
    }, 'min attribute is readonly');

    //readonly attribute double max;
    test(function() {
        var event = new DeviceProximityEvent('test');
        assert_readonly(event, 'max', 'readonly attribute max');
    }, 'max attribute is readonly');

    test(function() {
        var desc = 'Expected to find ondeviceproximity attribute on window object';
        assert_idl_attribute(window, 'ondeviceproximity', desc);
    }, 'ondeviceproximity exists');

    test(function() {
        var desc = 'window.ondeviceproximity must be null';
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'ondeviceproximity is null');

    test(function() {
        var desc = 'window.ondeviceproximity did not accept callable object',
            func = function() {},
            desc = 'Expected to find ondeviceproximity attribute on window object';
        assert_idl_attribute(window, 'ondeviceproximity', desc);
        window.ondeviceproximity = func;
        assert_equals(window.ondeviceproximity, func, desc);
    }, 'ondeviceproximity is set to function');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = {};
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat object as null');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = {
            call: 'test'
        };
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat object with non-callable call property as null');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable (string) as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = 'string';
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat string as null');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable (number) as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = 123;
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat number as null');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable (undefined) as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = undefined;
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat undefined as null');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable (array) as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = [];
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat array as null');

    test(function() {
        var desc = 'window.ondeviceproximity did not treat noncallable host object as null';
        window.ondeviceproximity = function() {};
        window.ondeviceproximity = Node;
        assert_equals(window.ondeviceproximity, null, desc);
    }, 'treat non-callable host object as null');

    //Async tests
    var t = async_test('test if device proximity event recieved');
    window.addEventListener('deviceproximity', function(e) {
        t.step(function() {
            var msg = 'expected instance of DeviceProximityEvent: ';
            assert_true(e instanceof window.DeviceProximityEvent, msg);
        });
        t.done();
    });

    var t2 = async_test('test if user proximity event recieved');
    window.ondeviceproximity = function(e) {
        t2.step(function() {
            var msg = 'expected instance of DeviceProximityEvent: ';
            assert_true(e instanceof window.DeviceProximityEvent, msg);
        });
        t2.done();
    };
})();
