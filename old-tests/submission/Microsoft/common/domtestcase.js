/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

//
// Log to console wrapper, use this so one doesn't create script errors on
// user agents that don't support console.log
function consoleLog(description)
{
    try
    {
        console.log(description);
    }
    catch(e)
    {
        alert(description);
    }
    
}

function assertEquals(description, expected, actual)
{
    var szError = description + " assertEquals failure: \r\n";

    if ( !(expected === actual))
    {
        szError = szError + "expected=" + expected + " \r\n";
        szError = szError + "actual=" + actual + " \r\n";

        throw szError;
    }
}

(function ()
{
    // default timeout is 5 seconds, test can override if needed
    var default_timeout = 5000;

    // tests either pass, fail or timeout
    var status =
    {
        PASS: 0,
        FAIL: 1,
        TIMEOUT: 2
    };
    expose(status, 'status');

    /*
    * API functions
    */
    function test(func, name, properties) 
    {
        properties = properties ? properties : {};
        var test_obj = new Test(name, properties);
        test_obj.step(func);
        test_obj.done();
    }

    function async_test(name, properties)
    {
        properties = properties ? properties : {};
        var test_obj = new Test(name, properties);
        return test_obj;
    }

    function on_event(object, event, callback)
    {
      object.addEventListener(event, callback, false);
    }

    expose(test, 'test');
    expose(async_test, 'async_test');
    expose(on_event, 'on_event');

    /*
    * Assertions
    */
    function assert_true(actual, description)
    {
        var message = make_message("assert_equals", description,
                                   format("expected true got %s", actual));
        assert(actual, message);
    }

    /*
    * Test if two primitives are equal or two objects
    * are the same object
    */
    function assert_equals(actual, expected, description)
    {
        var message = make_message("assert_equals", description,
                                   format("expected %s got %s", expected, actual));

        if (expected !== expected)
        {
              //NaN case
            assert(actual !== actual, message);
        } 
        else
        {
            //typical case
            assert(actual === expected, message);
        }
    }

    /*
    * Test if two objects have the same properties and
    * values of those properties, recursively
    */
    function assert_object_equals(actual, expected, description) 
    {
        //This needs to be improved a great deal
        function check_equal(expected, actual, stack)
        {
            stack.push(actual);

            for (p in actual)
            {
                var message = make_message( "assert_object_equals",
                                            description,
                                            format("unexpected property %s", p));

                assert( expected.hasOwnProperty(p), message);

                if (typeof actual[p] === "object" && actual[p] !== null) 
                {
                    if (stack.indexOf(actual[p]) === -1) 
                    {
                        check_equal(actual[p], expected[p], stack);
                    }
                }
                else
                {
                    message = make_message( "assert_object_equals",
                                            description,
                                            format("property %s expected %s got %s",
                                            p, expected, actual));

                    assert(actual[p] === expected[p], message);
                }
            }
            for (p in expected)
            {
                var message = make_message( "assert_object_equals",
                                            description,
                                            format("expected property %s missing", p));

                assert( actual.hasOwnProperty(p), message);
            }

            stack.pop();
        }

        check_equal(actual, expected, []);
    }

    function assert_exists(object, property_name, description)
    {
        var message = make_message( "assert_exists",
                                    description,
                                    format("expected property %s missing", property_name));

        assert(object.hasOwnProperty(property_name, message));
    }

    expose(assert_true, 'assert_true');
    expose(assert_equals, 'assert_equals');
    expose(assert_object_equals, 'assert_object_equals');
    expose(assert_exists, 'assert_exists');

    function Test(name, properties)
    {
       this.name = name;
       this.status = null;
       timeout = default_timeout;

       if (properties.timeout)
       {
           timeout = properties.timeout;
       }

       this.message = null;

       var this_obj = this;
       this.steps = [];
       this.timeout_id = setTimeout( function() { this_obj.timeout(); }, timeout);

       tests.push(this);
   }

    Test.prototype.step = function(func)
    {
        //In case the test has already failed
        if (this.status !== null)
        {
            return;
        }

        this.steps.push(func);

        try
        {
            func.apply(this, arguments);
        }
        catch(e)
        {
            this.status = status.FAIL;
            this.message = e.message;
        }
    };

    Test.prototype.timeout = function()
    {
        if (this.status == null)
        {
            this.status = status.TIMEOUT;
        }
        this.timeout_id = null;
        this.message = "test timed out";
        this.done();
    };

    Test.prototype.done = function()
    {
        clearTimeout(this.timeout_id);

        if (this.status == null)
        {
            this.status = status.PASS;
        }

        tests.done(this);
    };


   /*
    * Harness
    */
    var tests = new Tests();

    function Tests()
    {
        this.tests = [];
        this.pending_tests = 0;

        this.test_done_callbacks = [];
        this.all_done_callbacks = [];

        var this_obj = this;

        //All tests can't be done until the load event fires
        this.all_loaded = false;
     
        on_event( window, "load", function()
                                  {
                                      this_obj.all_loaded = true;

                                      if (this_obj.pending_tests == 0)
                                      {
                                          this_obj.notify_results();
                                      }
                                   });
   }

    Tests.prototype.push = function(test)
    {
        this.tests.push(test);
        this.pending_tests++;
    };

    Tests.prototype.done = function(test) 
    {
        this.pending_tests--;

        if (this.all_loaded && this.pending_tests == 0)
        {
            this.notify_results();
        }

        forEach(this.test_done_callbacks,
                function(callback)
                {
                    callback(test);
                });
    };

    Tests.prototype.notify_results = function() 
    {
        var test_objects = this.tests;
        var this_obj = this;

        forEach ( this.all_done_callbacks,
                  function(callback)
                  {
                      callback(this_obj.tests);
                  });
    };

    function add_result_callback(callback)
    {
        tests.test_done_callbacks.push(callback);
    }

    function add_completion_callback(callback)
    {
       tests.all_done_callbacks.push(callback);
    }

    expose(add_result_callback, 'add_result_callback');
    expose(add_completion_callback), 'add_completion_callback';

    /*
     * Output listener
    */
    function output_results(tests)
    {
        var status_text = {};
        status_text[status.PASS] = "PASS";
        status_text[status.FAIL] = "FAIL";
        status_text[status.TIMEOUT] = "TIMEOUT";
        status_text[status.NOTIMPLEMENTED] = "NOTIMPLEMENTED";

        forEach ( tests,
                  function(test)
                  {
                     var testtable = document.getElementById('testtable');
                     var row = testtable.insertRow(testtable.rows.length);

                     var testresult = table= row.insertCell(0);
                     var text_node = document.createTextNode(status_text[test.status]);

                     testresult.style.color = test.status === status.PASS ? "green" : "red";
                     testresult.appendChild(text_node);

                     var testassertion = table= row.insertCell(1);
                     var text = test.name;

                     if (test.status !== status.PASS && test.message)
                     {
                         text += format(" message: " + test.message);
                     }

                     text_node = document.createTextNode(text);
                     testassertion.appendChild(text_node);
                 });
   }

   add_completion_callback(output_results);


    /*
     * Utility funcions
     */
    function assert(expected_true, message)
    {
        if (expected_true !== true)
        {
            throw new AssertionError(message);
        }
    }

    function AssertionError(message)
    {
        this.message = message;
    }

    function make_message(function_name, description, error)
    {
        var message;
        
        if (description)
        {
            message = format("%s (%s): %s", function_name, description, error);
        }
        else
        {
            message = format("%s: %s", function_name, error);
        }

        return message;
    }

    function forEach (array, callback, thisObj)
    {
        for (var i=0; i<array.length; i++)
        {
            if (array.hasOwnProperty(i))
            {
                callback.call(thisObj, array[i], i, array);
            }
        }
   }

    function format(template)
    {
        var args = Array.prototype.slice.call(arguments, 1);
        var parts = template.split("%s");
        var full_string_parts = [];

        for (var i=0; i<parts.length-1; i++)
        {
            full_string_parts.push('' + parts[i]);
            full_string_parts.push('' + args[i]);
        }

        full_string_parts.push(parts[parts.length - 1]);

       return full_string_parts.join("");
    }

    function expose(object, name)
    {
        window[name] = object;
    }

})();
