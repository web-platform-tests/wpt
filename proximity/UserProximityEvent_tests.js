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
        var event = new UserProximityEvent('');
        assert_true(event instanceof window.UserProximityEvent);
    }, 'the event is an instance of UserProximityEvent');

    test(function() {
        var event = new UserProximityEvent('');
        assert_true(event instanceof window.Event);
    }, 'the event inherits from Event');

    //Type attribute tests
    test(function() {
        assert_throws(null, function() {
            new UserProximityEvent();
        }, 'First argument is required, so was expecting a TypeError.');
    }, 'Missing type argument');

    test(function() {
        var event = new UserProximityEvent(undefined);
        assert_equals(event.type, 'undefined');
    }, 'Event type set to undefined');

    test(function() {
        var event = new UserProximityEvent(null);
        assert_equals(event.type, 'null');
    }, 'type argument is null');

    test(function() {
        var event = new UserProximityEvent(123);
        assert_equals(event.type, '123');
    }, 'type argument is number');

    test(function() {
        var event = new UserProximityEvent(new Number(123));
        assert_equals(event.type, '123');
    }, 'type argument is Number');

    test(function() {
        var event = new UserProximityEvent([]);
        assert_equals(event.type, '');
    }, 'type argument is array');

    test(function() {
        var event = new UserProximityEvent(new Array());
        assert_equals(event.type, '');
    }, 'type argument is instance of Array');

    test(function() {
        var event = new UserProximityEvent(['t', ['e', ['s', ['t']]]]);
        assert_equals(event.type, 't,e,s,t');
    }, 'type argument is nested array');

    test(function() {
        var event = new UserProximityEvent(Math);
        assert_equals(event.type, '[object Math]');
    }, 'type argument is host object');

    test(function() {
        var event = new UserProximityEvent(true);
        assert_equals(event.type, 'true');
    }, 'type argument is boolean (true)');

    test(function() {
        var event = new UserProximityEvent(new Boolean(true));
        assert_equals(event.type, 'true');
    }, 'type argument is instance of boolean');

    test(function() {
        var event = new UserProximityEvent(false);
        assert_equals(event.type, 'false');
    }, 'type argument is boolean (false)');

    test(function() {
        var event = new UserProximityEvent(new Boolean(false));
        assert_equals(event.type, 'false');
    }, '');

    test(function() {
        var event = new UserProximityEvent('test');
        assert_equals(event.type, 'test');
    }, 'type argument is instance of boolean (false)');

    test(function() {
        var event = new UserProximityEvent(new String('test'));
        assert_equals(event.type, 'test');
    }, 'type argument is string');

    test(function() {
        var event = new UserProximityEvent(function test() {});
        assert_regexp_match(event.type, /function test.+{\s?}/);
    }, 'type argument is function');

    test(function() {
        var event = new UserProximityEvent({
            toString: function() {
                return '123';
            }
        });
        assert_equals(event.type, '123');
    }, 'type argument is complext object, with toString method');

    test(function() {
        assert_throws(null, function() {
            new UserProximityEvent({
                toString: function() {
                    return function() {}
                }
            });
        });
    }, 'toString is of type function');

    //test readonly attribute boolean near;
    test(function() {
        var event = new UserProximityEvent('test');
        assert_idl_attribute(event, 'near', 'must have attribute near');
    }, 'must have attribute near');


    test(function() {
        var event = new UserProximityEvent('test');
        assert_readonly(event, 'near', 'readonly attribute near');
    }, 'near is readonly');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: false
        });
        assert_equals(event.near, false, 'near set to false');
    }, 'near set to false');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: true
        });
        assert_equals(event.near, true, 'near set to true');
    }, 'near set to true');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: undefined
        });
        assert_equals(event.near, false, 'argument is truthy');
    }, 'near set to a falsy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: null
        });
        assert_equals(event.near, false, 'argument is flasy');
    }, 'near set to a falsy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: 0
        });
        assert_equals(event.near, false, 'argument is flasy');
    }, 'near set to a falsy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: ''
        });
        assert_equals(event.near, false, 'argument is flasy');
    }, 'near set to a falsy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: '\u0020'
        });
        assert_equals(event.near, true, 'argument is truthy');
    }, 'near set to a truthy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: 1
        });
        assert_equals(event.near, true, 'argument is truthy');
    }, 'near set to a truthy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: []
        });
        assert_equals(event.near, true, 'argument is truthy');
    }, 'near set to a truthy object');

    test(function() {
        var event = new UserProximityEvent('test', {
            near: {}
        });
        assert_equals(event.near, true, 'argument is truthy');
    }, 'near set to a truthy object');

    test(function() {
        var dict = {
            get test() {
                return false;
            }
        };
        var event = new UserProximityEvent('test', {
            near: dict.test
        });
        assert_equals(event.near, false, 'explict false');
    }, 'near set to object that resolves to false');

    test(function() {
        var desc = 'Expected to find onuserproximity attribute on window object';
        assert_idl_attribute(window, 'onuserproximity', desc);
    }, 'onuserproximity exists');

    test(function() {
        var desc = 'window.onuserproximity must be null';
        assert_equals(window.onuserproximity, null, desc);
    }, 'onuserproximity is null');

    test(function() {
        var desc = 'window.onuserproximity did not accept callable object',
            func = function() {},
            desc = 'onuserproximity does not exist';
        assert_idl_attribute(window, 'onuserproximity', desc);
        window.onuserproximity = func;
        assert_equals(window.onuserproximity, func, desc);
    }, 'onuserproximity exists and can be set to a function');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable as null';
        window.onuserproximity = function() {};
        window.onuserproximity = {};
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat object as null');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable as null';
        window.onuserproximity = function() {};
        window.onuserproximity = {
            call: 'test'
        };
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat object with non-callable call property as null');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable (string) as null';
        window.onuserproximity = function() {};
        window.onuserproximity = 'string';
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat string as null');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable (number) as null';
        window.onuserproximity = function() {};
        window.onuserproximity = 123;
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat number as null');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable (undefined) as null';
        window.onuserproximity = function() {};
        window.onuserproximity = undefined;
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat undefined as null');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable (array) as null';
        window.onuserproximity = function() {};
        window.onuserproximity = [];
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat array as null');

    test(function() {
        var desc = 'window.onuserproximity did not treat noncallable host object as null';
        window.onuserproximity = function() {};
        window.onuserproximity = Node;
        assert_equals(window.onuserproximity, null, desc);
    }, 'treat non-callable host object as null');

    //Async tests
    var t = async_test('test if user proximity event recieved');
    window.addEventListener('userproximity', function(e) {
        t.step(function() {
            var msg = 'expected instance of UserProximityEvent: ';
            assert_true(e instanceof window.UserProximityEvent, msg);
        });
        t.done();
    });

    var t2 = async_test('test if user proximity event recieved');
    window.onuserproximity = function(e) {
        t2.step(function() {
            var msg = 'expected instance of UserProximityEvent: ';
            assert_true(e instanceof window.UserProximityEvent, msg);
        });
        t2.done();
    };
})();
