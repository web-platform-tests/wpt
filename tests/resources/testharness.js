/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

/*
 * == Introduction ==
 *
 * This file provides a framework for writing testcases. It is intended to
 * provide a convenient API for making common assertions, and to work both
 * for testing synchronous and asynchronous DOM features in a way that
 * promotes clear, robust, tests.
 *
 * == Basic Usage ==
 *
 * To use this file, import the script into the test document:
 * <script src="http://w3c-test.org/resources/testharness.js"></script>
 *
 * Within each file one may define one or more tests. Each test is atomic
 * in the sense that a single test has a single result (pass/fail/timeout).
 * Within each test one may have a number of asserts. The test fails at the
 * first failing assert, and the remainder of the test is (typically) not run.
 *
 * If the file containing the tests is a HTML file with an element of id "log"
 * this will be populated with a table containing the test results after all
 * the tests have run.
 *
 * == Synchronous Tests ==
 *
 * To create a synchronous test use the test() function:
 *
 * test(test_function, name, properties)
 *
 * test_function is a function that contains the code to test. For example a
 * trivial passing test would be:
 *
 * test(function() {assert_true(true)}, "assert_true with true")
 *
 * The function passed in is run in the test() call.
 *
 * properties is an object that overrides default test properties. The recognised properties
 * are:
 *    timeout - the test timeout in ms
 *
 * e.g.
 * test(test_function, "Sample test", {timeout:1000})
 *
 * would run test_function with a timeout of 1s.
 *
 * == Asynchronous Tests ==
 *
 * Testing asynchronous features is somewhat more complex since the result of
 * a test may depend on one or more events or other callbacks. The API provided
 * for testing these features is indended to be rather low-level but hopefully
 * applicable to many situations.
 *
 * To create a test, one starts by getting a Test object using async_test:
 *
 * async_test(name, properties)
 *
 * e.g.
 * var t = async_test("Simple async test")
 *
 * Assertions can be added to the test by calling the step method of the test
 * object with a function containing the test assertions:
 *
 * t.step(function() {assert_true(true)});
 *
 * When all the steps are complete, the done() method must be called:
 *
 * t.done();
 *
 * The properties argument is identical to that for test().
 *
 * In many cases it is convenient to run a step in response to an event or a
 * callback. A convenient method of doing this is through the step_func method
 * which returns a function that, when called runs a test step. For example
 *
 * object.some_event = t.step_func(function(e) {assert_true(e.a)});
 *
 * == Making assertions ==
 *
 * Functions for making assertions start assert_
 * The best way to get a list is to look in this file for functions names
 * matching that pattern. The general signature is
 *
 * assert_something(actual, expected, description)
 *
 * although not all assertions precisely match this pattern e.g. assert_true
 * only takes actual and description as arguments.
 *
 * The description parameter is used to present more useful error messages when
 * a test fails
 *
 * == Setup ==
 *
 * Sometimes tests require non-trivial setup that may fail. For this purpose
 * there is a setup() function, that may be called with one or two arguments.
 * The two argument version is:
 *
 * setup(func, properties)
 *
 * The one argument versions may omit either argument.
 * func is a function to be run synchronously. setup() becomes a no-op once
 * any tests have returned results. Properties are global properties of the test
 * harness. Currently recognised properties are:
 *
 * timeout - The time in ms after which the harness should stop waiting for
 *           tests to complete (this is different to the per-test timeout
 *           because async tests do not start their timer until .step is called)
 *
 * explicit_done - Wait for an explicit call to done() before declaring all tests
 *                 complete (see below)
 *
 * == Determining when all tests are complete ==
 *
 * By default the test harness will assume there are no more results to come
 * when:
 * 1) There are no Test objects that have been created but not completed
 * 2) The load event on the document has fired
 *
 * This behaviour can be overridden by setting the explicit_done property to true
 * in a call to setup(). If explicit_done is true, the test harness will not assume
 * it is done until the global done() function is called. Once done() is called, the
 * two conditions above apply like normal.
 *
 * == Generating tests ==
 *
 * NOTE: this functionality may be removed
 *
 * There are scenarios in which is is desirable to create a large number of
 * (synchronous) tests that are internally similar but vary in the parameters
 * used. To make this easier, the generate_tests function allows a single
 * function to be called with each set of parameters in a list:
 *
 * generate_tests(test_function, parameter_lists)
 *
 * For example:
 *
 * generate_tests(assert_equals, [
 *     ["Sum one and one", 1+1, 2],
 *     ["Sum one and zero", 1+0, 1]
 *     ])
 *
 * Is equivalent to:
 *
 * test(function() {assert_equals(1+1, 2)}, "Sum one and one")
 * test(function() {assert_equals(1+0, 1)}, "Sum one and zero")
 *
 * Note that the first item in each parameter list corresponds to the name of
 * the test.
 *
 * == Callback API ==
 *
 * The framework provides callbacks corresponding to 3 events:
 *
 * start - happens when the first Test is created
 * result - happens when a test result is recieved
 * complete - happens when all results are recieved
 *
 * The page defining the tests may add callbacks for these events by calling
 * the following methods:
 *
 *   add_start_callback(callback) - callback called with no arguments
 *   add_result_callback(callback) - callback called with a test argument
 *   add_completion_callback(callback) - callback called with an array of tests
 *                                       and an status object
 *
 * tests have the following properties:
 *   status: A status code. This can be compared to the PASS, FAIL, TIMEOUT and
 *           NOTRUN properties on the test object
 *   message: A message indicating the reason for failure. In the future this
 *            will always be a string
 *
 *  The status object gives the overall status of the harness. It has the
 *  following properties:
 *    status: Can be compared to the OK, ERROR and TIMEOUT properties
 *    message: An error message set when the status is ERROR
 *
 * == External API ==
 *
 * In order to collect the results of multiple pages containing tests, the test
 * harness will, when loaded in a nested browsing context, attempt to call
 * certain functions in the top level browsing context:
 *
 * start - top.start_callback
 * result - top.result_callback
 * complete - top.completion_callback
 *
 * These are given the same arguments as the corresponding internal callbacks
 * described above.
 *
 * == List of assertions ==
 *
 * assert_true(actual, description)
 *   asserts that /actual/ is strictly true
 *
 * assert_false(actual, description)
 *   asserts that /actual/ is strictly false
 *
 * assert_equals(actual, expected, description)
 *   asserts that /actual/ is the same value as /expected/
 *
 * assert_not_equals(actual, expected, description)
 *   asserts that /actual/ is a different value to /expected/. Yes, this means
 *   that "expected" is a misnomer
 *
 * assert_array_equals(actual, expected, description)
 *   asserts that /actual/ and /expected/ have the same length and the value of
 *   each indexed property in /actual/ is the strictly equal to the corresponding
 *   property value in /expected/
 *
 * assert_regexp_match(actual, expected, description)
 *   asserts that /actual/ matches the regexp /expected/
 *
 * assert_own_property(object, property_name, description)
 *   assert that object has own property property_name
 *
 * assert_inherits(object, property_name, description)
 *   assert that object does not have an own property named property_name
 *   but that property_name is present in the prototype chain for object
 *
 * assert_idl_attribute(object, attribute_name, description)
 *   assert that an object that is an instance of some interface has the
 *   attribute attribute_name following the conditions specified by WebIDL
 *
 * assert_readonly(object, property_name, description)
 *   assert that property property_name on object is readonly
 *
 * assert_throws(code, func, description)
 *   code - a DOMException/RangeException code as a string, e.g. "HIERARCHY_REQUEST_ERR"
 *   func - a function that should throw
 *
 *   assert that func throws a DOMException or RangeException (as appropriate)
 *   with the given code.  If an object is passed for code instead of a string,
 *   checks that the thrown exception has a property called "name" that matches
 *   the property of code called "name".  Note, this function will probably be
 *   rewritten sometime to make more sense.
 *
 * assert_unreached(description)
 *   asserts if called. Used to ensure that some codepath is *not* taken e.g.
 *   an event does not fire.
 *
 * assert_exists(object, property_name, description)
 *   *** deprecated ***
 *   asserts that object has an own property property_name
 *
 * assert_not_exists(object, property_name, description)
 *   *** deprecated ***
 *   assert that object does not have own property property_name
 */

(function ()
{
    var debug = false;
    // default timeout is 5 seconds, test can override if needed
    var default_timeout = 5000;
    var default_test_timeout = 2000;

    /*
     * API functions
     */

    var name_counter = 0;
    function next_default_name()
    {
        //Don't use document.title to work around an Opera bug in XHTML documents
        var prefix = document.getElementsByTagName("title").length > 0 ?
                         document.getElementsByTagName("title")[0].firstChild.data :
                         "Untitled";
        var suffix = name_counter > 0 ? " " + name_counter : "";
        name_counter++;
        return prefix + suffix;
    }

    function test(func, name, properties)
    {
        var test_name = name ? name : next_default_name();
        properties = properties ? properties : {};
        var test_obj = new Test(test_name, properties);
        test_obj.step(func);
        if (test_obj.status === test_obj.NOTRUN) {
            test_obj.done();
        }
    }

    function async_test(name, properties)
    {
        var test_name = name ? name : next_default_name();
        properties = properties ? properties : {};
        var test_obj = new Test(test_name, properties);
        return test_obj;
    }

    function setup(func_or_properties, properties_or_func)
    {
        var func = null;
        var properties = {};
        if (arguments.length === 2) {
            func = func_or_properties;
            properties = properties_or_func;
        } else if (func_or_properties instanceof Function){
            func = func_or_properties;
        } else {
            properties = func_or_properties;

        }
        tests.setup(func, properties);
    }

    function done() {
        tests.end_wait();
    }

    function generate_tests(func, args) {
        forEach(args, function(x)
                {
                    var name = x[0];
                    test(function()
                         {
                             func.apply(this, x.slice(1));
                         }, name);
                });
    }

    function on_event(object, event, callback)
    {
      object.addEventListener(event, callback, false);
    }

    expose(test, 'test');
    expose(async_test, 'async_test');
    expose(generate_tests, 'generate_tests');
    expose(setup, 'setup');
    expose(done, 'done');
    expose(on_event, 'on_event');

    /*
     * Convert a value to a nice, human-readable string
     */
    function format_value(val)
    {
        if (val === null)
        {
            // typeof is object, so the switch isn't useful
            return "null";
        }
        // In JavaScript, -0 === 0 and String(-0) == "0", so we have to
        // special-case.
        if (val === -0 && 1/val === -Infinity)
        {
            return "-0";
        }
        // Special-case Node objects, since those come up a lot in my tests.  I
        // ignore namespaces.  I use duck-typing instead of instanceof, because
        // instanceof doesn't work if the node is from another window (like an
        // iframe's contentWindow):
        // http://www.w3.org/Bugs/Public/show_bug.cgi?id=12295
        if (typeof val == "object"
        && "nodeType" in val
        && "nodeName" in val
        && "nodeValue" in val
        && "childNodes" in val)
        {
            switch (val.nodeType)
            {
            case Node.ELEMENT_NODE:
                var ret = "Element node <";
                if (val.namespaceURI == "http://www.w3.org/1999/xhtml" || val.namespaceURI === null)
                {
                    ret += val.tagName.toLowerCase();
                }
                else
                {
                    ret += val.tagName;
                }
                for (var i = 0; i < val.attributes.length; i++)
                {
                    ret += " " + val.attributes[i].name + "=" + format_value(val.attributes[i].value);
                }
                ret += "> with " + val.childNodes.length + (val.childNodes.length == 1 ? " child" : " children");
                return ret;
            case Node.TEXT_NODE:
                return "Text node with data " + format_value(val.data) + " and parent " + format_value(val.parentNode);
            case Node.PROCESSING_INSTRUCTION_NODE:
                return "ProcessingInstruction node with target " + format_value(val.target) + " and data " + format_value(val.data);
            case Node.COMMENT_NODE:
                return "Comment node with data " + format_value(val.data);
            case Node.DOCUMENT_NODE:
                return "Document node with " + val.childNodes.length + (val.childNodes.length == 1 ? " child" : " children");
            case Node.DOCUMENT_TYPE_NODE:
                return "DocumentType node";
            case Node.DOCUMENT_FRAGMENT_NODE:
                return "DocumentFragment node with " + val.childNodes.length + (val.childNodes.length == 1 ? " child" : " children");
            default:
                return "Node object of unknown type";
            }
        }
        switch (typeof val)
        {
        case "string":
            for (var i = 0; i < 32; i++)
            {
                var replace = "\\";
                switch (i) {
                case 0: replace += "0"; break;
                case 1: replace += "x01"; break;
                case 2: replace += "x02"; break;
                case 3: replace += "x03"; break;
                case 4: replace += "x04"; break;
                case 5: replace += "x05"; break;
                case 6: replace += "x06"; break;
                case 7: replace += "x07"; break;
                case 8: replace += "b"; break;
                case 9: replace += "t"; break;
                case 10: replace += "n"; break;
                case 11: replace += "v"; break;
                case 12: replace += "f"; break;
                case 13: replace += "r"; break;
                case 14: replace += "x0e"; break;
                case 15: replace += "x0f"; break;
                case 16: replace += "x10"; break;
                case 17: replace += "x11"; break;
                case 18: replace += "x12"; break;
                case 19: replace += "x13"; break;
                case 20: replace += "x14"; break;
                case 21: replace += "x15"; break;
                case 22: replace += "x16"; break;
                case 23: replace += "x17"; break;
                case 24: replace += "x18"; break;
                case 25: replace += "x19"; break;
                case 26: replace += "x1a"; break;
                case 27: replace += "x1b"; break;
                case 28: replace += "x1c"; break;
                case 29: replace += "x1d"; break;
                case 30: replace += "x1e"; break;
                case 31: replace += "x1f"; break;
                }
                val = val.replace(String.fromCharCode(i), replace);
            }
            return '"' + val.replace('"', '\\"') + '"';
        case "boolean":
        case "undefined":
        case "number":
            return String(val);
        default:
            return typeof val + ' "' + val + '"';
        }
    }
    expose(format_value, "format_value");

    /*
     * Assertions
     */

    function assert_true(actual, description)
    {
        var message = make_message("assert_true", description,
                                   "expected true got ${actual}", {actual:actual});
        assert(actual === true, message);
    };
    expose(assert_true, "assert_true");

    function assert_false(actual, description)
    {
        var message = make_message("assert_false", description,
                                   "expected false got ${actual}", {actual:actual});
        assert(actual === false, message);
    };
    expose(assert_false, "assert_false");

    function same_value(x, y) {
        if (y !== y)
        {
            //NaN case
            return x !== x;
        }
        else if (x === 0 && y === 0) {
            //Distinguish +0 and -0
            return 1/x === 1/y;
        }
        else
        {
            //typical case
            return x === y;
        }
    }

    function assert_equals(actual, expected, description)
    {
         /*
          * Test if two primitives are equal or two objects
          * are the same object
          */
        var message = make_message("assert_equals", description,
                                    "expected ${expected} but got ${actual}",
                                    {expected:expected, actual:actual});

        assert(same_value(actual, expected), message);
    };
    expose(assert_equals, "assert_equals");

    function assert_not_equals(actual, expected, description)
    {
         /*
          * Test if two primitives are unequal or two objects
          * are different objects
          */
         var message = make_message("assert_not_equals", description,
                                    "got disallowed value ${actual}",
                                    {actual:actual});

        assert(!same_value(actual, expected), message);
    };
    expose(assert_not_equals, "assert_not_equals");

    function assert_object_equals(actual, expected, description)
    {
         //This needs to be improved a great deal
         function check_equal(expected, actual, stack)
         {
             stack.push(actual);

             var p;
             for (p in actual)
             {
                 var message = make_message(
                     "assert_object_equals", description,
                     "unexpected property ${p}", {p:p});

                 assert(expected.hasOwnProperty(p), message);

                 if (typeof actual[p] === "object" && actual[p] !== null)
                 {
                     if (stack.indexOf(actual[p]) === -1)
                     {
                         check_equal(actual[p], expected[p], stack);
                     }
                 }
                 else
                 {
                     message = make_message(
                         "assert_object_equals", description,
                         "property ${p} expected ${expected} got ${actual}",
                         {p:p, expected:expected, actual:actual});

                     assert(actual[p] === expected[p], message);
                 }
             }
             for (p in expected)
             {
                 var message = make_message(
                     "assert_object_equals", description,
                     "expected property ${p} missing", {p:p});

                 assert(actual.hasOwnProperty(p), message);
             }
             stack.pop();
         }
         check_equal(actual, expected, []);
    };
    expose(assert_object_equals, "assert_object_equals");

    function assert_array_equals(actual, expected, description)
    {
        var message = make_message(
            "assert_array_equals", description,
            "lengths differ, expected ${expected} got ${actual}",
            {expected:expected.length, actual:actual.length});

        assert(actual.length === expected.length, message);

        for (var i=0; i < actual.length; i++)
        {
            message = make_message(
                "assert_array_equals", description,
                "property ${i}, property expected to be $expected but was $actual",
                {i:i, expected:expected.hasOwnProperty(i) ? "present" : "missing",
                 actual:actual.hasOwnProperty(i) ? "present" : "missing"});
            assert(actual.hasOwnProperty(i) === expected.hasOwnProperty(i), message);
            message = make_message(
                          "assert_array_equals", description,
                          "property ${i}, expected ${expected} but got ${actual}",
                          {i:i, expected:expected[i], actual:actual[i]});
            assert(expected[i] === actual[i], message);
        }
    }
    expose(assert_array_equals, "assert_array_equals");

    function assert_regexp_match(actual, expected, description) {
        /*
         * Test if a string (actual) matches a regexp (expected)
         */
        var message = make_message("assert_regexp_match", description,
                                   "expected ${expected} but got ${actual}",
                                   {expected:expected, actual:actual});
        assert(expected.test(actual), message);
    }
    expose(assert_regexp_match, "assert_regexp_match");


    function _assert_own_property(name) {
        return function(object, property_name, description)
        {
            var message = make_message(
                name, description,
                "expected property ${p} missing", {p:property_name});

            assert(object.hasOwnProperty(property_name), message);
        };
    }
    expose(_assert_own_property("assert_exists"), "assert_exists");
    expose(_assert_own_property("assert_own_property"), "assert_own_property");

    function assert_not_exists(object, property_name, description)
    {
        var message = make_message(
            "assert_not_exists", description,
            "unexpected property ${p} found", {p:property_name});

        assert(!object.hasOwnProperty(property_name), message);
    };
    expose(assert_not_exists, "assert_not_exists");

    function _assert_inherits(name) {
        return function (object, property_name, description)
        {
            var message = make_message(
                name, description,
                "property ${p} found on object expected in prototype chain",
                {p:property_name});
            assert(!object.hasOwnProperty(property_name), message);

            message = make_message(
                name, description,
                "property ${p} not found in prototype chain",
                {p:property_name});
            assert(property_name in object, message);
        };
    }
    expose(_assert_inherits("assert_inherits"), "assert_inherits");
    expose(_assert_inherits("assert_idl_attribute"), "assert_idl_attribute");

    function assert_readonly(object, property_name, description)
    {
         var initial_value = object[property_name];
         try {
             var message = make_message(
                 "assert_readonly", description,
                 "deleting property ${p} succeeded", {p:property_name});
             assert(delete object[property_name] === false, message);
             assert(object[property_name] === initial_value, message);
             //Note that this can have side effects in the case where
             //the property has PutForwards
             object[property_name] = initial_value + "a"; //XXX use some other value here?
             message = make_message("assert_readonly", description,
                                    "changing property ${p} succeeded",
                                    {p:property_name});
             assert(object[property_name] === initial_value, message);
         }
         finally
         {
             object[property_name] = initial_value;
         }
    };
    expose(assert_readonly, "assert_readonly");

    function assert_throws(code, func, description)
    {
        try
        {
            func.call(this);
            assert(false, make_message("assert_throws", description,
                                      "${func} did not throw", {func:func}));
        }
        catch(e)
        {
            if (e instanceof AssertionError) {
                throw(e);
            }
            if (typeof code === "object")
            {
                assert(typeof e == "object" && "name" in e && e.name == code.name,
                       make_message("assert_throws", description,
                           "${func} threw ${actual} (${actual_name}) expected ${expected} (${expected_name})",
                                    {func:func, actual:e, actual_name:e.name,
                                     expected:code,
                                     expected_name:code.name}));
                return;
            }
            var required_props = {};
            var expected_type;
            if (code in DOMException)
            {
                expected_type = "DOMException";
                required_props[code] = DOMException[code];
                required_props.code = DOMException[code];
                //Uncomment this when the latest version of every browser
                //actually implements the spec; otherwise it just creates
                //zillions of failures
                //required_props.name = code;
            }
            else if (code in RangeException)
            {
                expected_type = "RangeException";
                required_props[code] = RangeException[code];
                required_props.code = RangeException[code];
                //As above
                //required_props.name = code;
            }
            else
            {
                throw new AssertionError('Test bug: unrecognized code "' + code + '" passed to assert_throws()');
            }
            //We'd like to test that e instanceof the appropriate interface,
            //but we can't, because we don't know what window it was created
            //in.  It might be an instanceof the appropriate interface on some
            //unknown other window.  TODO: Work around this somehow?

            assert(typeof e == "object",
                    make_message("assert_throws", description,
                        "${func} threw ${e} with type ${type}, not an object",
                                {func:func, e:e, type:typeof e}));

            for (var prop in required_props)
            {
                assert(typeof e == "object" && prop in e && e[prop] == required_props[prop],
                        make_message("assert_throws", description,
                            "${func} threw ${e} that is not a " + expected_type + " " + code + ": property ${prop} is equal to ${actual}, expected ${expected}",
                                {func:func, e:e, prop:prop, actual:e[prop], expected:required_props[prop]}));
            }
        }
    }
    expose(assert_throws, "assert_throws");

    function assert_unreached(description) {
         var message = make_message("assert_unreached", description,
                                    "Reached unreachable code");

         assert(false, message);
    }
    expose(assert_unreached, "assert_unreached");

    function Test(name, properties)
    {
        this.name = name;
        this.status = this.NOTRUN;
        this.timeout_id = null;
        this.is_done = false;

        this.timeout_length = properties.timeout ? properties.timeout : default_test_timeout;

        this.message = null;

        var this_obj = this;
        this.steps = [];

        tests.push(this);
    }

    Test.prototype = {
        PASS:0,
        FAIL:1,
        TIMEOUT:2,
        NOTRUN:3
    };


    Test.prototype.step = function(func, this_obj)
    {
        //In case the test has already failed
        if (this.status !== this.NOTRUN)
        {
          return;
        }

        tests.started = true;

        if (this.timeout_id === null) {
            this.set_timeout();
        }

        this.steps.push(func);

        try
        {
            func.apply(this_obj, Array.prototype.slice.call(arguments, 2));
        }
        catch(e)
        {
            //This can happen if something called synchronously invoked another
            //step
            if (this.status !== this.NOTRUN)
            {
                return;
            }
            this.status = this.FAIL;
            this.message = e.message;
            if (typeof e.stack != "undefined" && typeof e.message == "string") {
                //Try to make it more informative for some exceptions, at least
                //in Gecko and WebKit.  This results in a stack dump instead of
                //just errors like "Cannot read property 'parentNode' of null"
                //or "root is null".  Makes it a lot longer, of course.
                this.message += "(stack: " + e.stack + ")";
            }
            this.done();
            if (debug && e.constructor !== AssertionError) {
                throw e;
            }
        }
    };

    Test.prototype.step_func = function(func, this_obj)
    {
        var test_this = this;
        return function()
        {
            test_this.step.apply(test_this, [func, this_obj].concat(
                                     Array.prototype.slice.call(arguments)));
        };
    };

    Test.prototype.set_timeout = function()
    {
        var this_obj = this;
        this.timeout_id = setTimeout(function()
                                     {
                                         this_obj.timeout();
                                     }, this.timeout_length);
    };

    Test.prototype.timeout = function()
    {
        this.status = this.TIMEOUT;
        this.timeout_id = null;
        this.message = "Test timed out";
        this.done();
    };

    Test.prototype.done = function()
    {
        if (this.is_done) {
            return;
        }
        clearTimeout(this.timeout_id);
        if (this.status === this.NOTRUN)
        {
            this.status = this.PASS;
        }
        this.is_done = true;
        tests.result(this);
    };


    /*
     * Harness
     */

    function TestsStatus()
    {
        this.status = null;
        this.message = null;
    }
    TestsStatus.prototype = {
        OK:0,
        ERROR:1,
        TIMEOUT:2
    };

    function Tests()
    {
        this.tests = [];
        this.num_pending = 0;

        this.phases = {
            INITIAL:0,
            SETUP:1,
            HAVE_TESTS:2,
            HAVE_RESULTS:3,
            COMPLETE:4
        };
        this.phase = this.phases.INITIAL;

        //All tests can't be done until the load event fires
        this.all_loaded = false;
        this.wait_for_finish = false;
        this.processing_callbacks = false;

        this.timeout_length = default_timeout;
        this.timeout_id = null;
        this.set_timeout();

        this.start_callbacks = [];
        this.test_done_callbacks = [];
        this.all_done_callbacks = [];

        this.status = new TestsStatus();

        var this_obj = this;

        on_event(window, "load",
                 function()
                 {
                     this_obj.all_loaded = true;
                     if (this_obj.all_done())
                     {
                         this_obj.complete();
                     }
                 });
    }

    Tests.prototype.setup = function(func, properties)
    {
        if (this.phase >= this.phases.HAVE_RESULTS) {
            return;
        }
        if (this.phase < this.phases.SETUP) {
            this.phase = this.phases.SETUP;
        }

        if (properties.timeout)
        {
            this.timeout_length = properties.timeout;
            this.set_timeout();
        }
        if (properties.explicit_done)
        {
            this.wait_for_finish = true;
        }

        if (func)
        {
            try
            {
                func();
            } catch(e)
            {
                this.status.status = this.status.ERROR;
                this.status.message = e;
            };
        }
    };

    Tests.prototype.set_timeout = function()
    {
        var this_obj = this;
        clearTimeout(this.timeout_id);
        this.timeout_id = setTimeout(function() {
                                         this_obj.timeout();
                                     }, this.timeout_length);
    };

    Tests.prototype.timeout = function() {
        this.status.status = this.status.TIMEOUT;
        this.complete();
    };

    Tests.prototype.end_wait = function()
    {
        this.wait_for_finish = false;
        if (this.all_done()) {
            this.complete();
        }
    };

    Tests.prototype.push = function(test)
    {
        if (this.phase < this.phases.HAVE_TESTS) {
            this.notify_start();
        }
        this.num_pending++;
        this.tests.push(test);
    };

    Tests.prototype.all_done = function() {
        return (this.all_loaded && this.num_pending === 0 &&
                !this.wait_for_finish && !this.processing_callbacks);
    };

    Tests.prototype.start = function() {
        this.phase = this.phases.HAVE_TESTS;
        this.notify_start();
    };

    Tests.prototype.notify_start = function() {
        var this_obj = this;
        forEach (this.start_callbacks,
                 function(callback)
                 {
                     callback(this_obj);
                 });
        if(top !== window && top.start_callback)
        {
            try
            {
                top.start_callback.call(this_obj);
            }
            catch(e)
            {
                if (debug)
                {
                    throw(e);
                }
            }
        }
    };

    Tests.prototype.result = function(test)
    {
        if (this.phase > this.phases.HAVE_RESULTS)
        {
            return;
        }
        this.phase = this.phases.HAVE_RESULTS;
        this.num_pending--;
        this.notify_result(test);
    };

    Tests.prototype.notify_result = function(test) {
        var this_obj = this;
        this.processing_callbacks = true;
        forEach(this.test_done_callbacks,
                function(callback)
                {
                    callback(test, this_obj);
                });

        if(top !== window && top.result_callback)
        {
            try
            {
                top.result_callback.call(this_obj, test);
            }
            catch(e)
            {
                if(debug) {
                    throw e;
                }
            }
        }
        this.processing_callbacks = false;
        if (this.all_done())
        {
            this.complete();
        }

    };

    Tests.prototype.complete = function() {
        if (this.phase === this.phases.COMPLETE) {
            return;
        }
        this.phase = this.phases.COMPLETE;
        this.notify_complete();
    };

    Tests.prototype.notify_complete = function()
    {
        clearTimeout(this.timeout_id);
        var this_obj = this;
        if (this.status.status === null)
        {
            this.status.status = this.status.OK;
        }

        forEach (this.all_done_callbacks,
                 function(callback)
                 {
                     callback(this_obj.tests, this_obj.status);
                 });
        if(top !== window && top.completion_callback)
        {
            try
            {
                top.completion_callback(this_obj.tests, this.status);
            }
            catch(e)
            {
                if (debug)
                {
                    throw e;
                }
            }

        }
    };

    var tests = new Tests();
    add_completion_callback(output_results);


    function add_start_callback(callback) {
        tests.start_callbacks.push(callback);
    }

    function add_result_callback(callback)
    {
        tests.test_done_callbacks.push(callback);
    }

    function add_completion_callback(callback)
    {
       tests.all_done_callbacks.push(callback);
    }

    expose(add_start_callback, 'add_start_callback');
    expose(add_result_callback, 'add_result_callback');
    expose(add_completion_callback, 'add_completion_callback');

    /*
     * Output listener
    */

    (function show_status() {
        var done_count = 0;
         function on_done(test, tests) {
             var log = document.getElementById("log");
             done_count++;
             if (log)
             {
                 if (log.lastChild) {
                     log.removeChild(log.lastChild);
                 }
                 var nodes = render([["{text}", "Running, ${done} complete"],
                                 function() {
                                     if (tests.all_done) {
                                         return ["{text}", " ${pending} remain"];
                                     } else {
                                         return null;
                                     }
                                 }
                                    ], {done:done_count,
                                        pending:tests.num_pending});
                 forEach(nodes, function(node) {
                             log.appendChild(node);
                         });
                 log.normalize();
             }
         }
         if (document.getElementById("log"))
         {
             add_result_callback(on_done);
         }
     })();

    function output_results(tests, harness_status)
    {
        var log = document.getElementById("log");
        if (!log)
        {
            return;
        }
        while (log.lastChild)
        {
            log.removeChild(log.lastChild);
        }
        var prefix = null;
        var scripts = document.getElementsByTagName("script");
        for (var i=0; i<scripts.length; i++)
        {
            var src = scripts[i].src;
            if (src.slice(src.length - "testharness.js".length) === "testharness.js")
            {
                prefix = src.slice(0, src.length - "testharness.js".length);
                break;
            }
        }
        if (prefix != null) {
            var stylesheet = document.createElement("link");
            stylesheet.setAttribute("rel", "stylesheet");
            stylesheet.setAttribute("href", prefix + "testharness.css");
            var heads = document.getElementsByTagName("head");
            if (heads) {
                heads[0].appendChild(stylesheet);
            }
        }

        var status_text = {};
        status_text[Test.prototype.PASS] = "Pass";
        status_text[Test.prototype.FAIL] = "Fail";
        status_text[Test.prototype.TIMEOUT] = "Timeout";
        status_text[Test.prototype.NOTRUN] = "Not Run";

        var status_number = {};
        forEach(tests, function(test) {
                    var status = status_text[test.status];
                    if (status_number.hasOwnProperty(status))
                    {
                        status_number[status] += 1;
                    } else {
                        status_number[status] = 1;
                    }
                });

        function status_class(status)
        {
            return status.replace(/\s/g, '').toLowerCase();
        }

        var summary_template = ["section", {"id":"summary"},
                                ["h2", {}, "Summary"],
                                ["p", {}, "Found ${num_tests} tests"],
                                function(vars) {
                                    var rv = [["div", {}]];
                                    var i=0;
                                    while (status_text.hasOwnProperty(i)) {
                                        if (status_number.hasOwnProperty(status_text[i])) {
                                            var status = status_text[i];
                                            rv[0].push(["div", {"class":status_class(status)},
                                                        ["input", {type:"checkbox", checked:"checked"}],
                                                       status_number[status] + " " + status]);
                                        }
                                        i++;
                                    }
                                    return rv;
                                }];

        log.appendChild(render(summary_template, {num_tests:tests.length}));

        forEach(document.querySelectorAll("section#summary input"),
                function(element)
                {
                    on_event(element, "click",
                             function(e)
                             {
                                 if (document.getElementById("results") === null)
                                 {
                                     e.preventDefault();
                                     return;
                                 }
                                 var result_class = element.parentNode.getAttribute("class");
                                 var style_element = document.querySelector("style#hide-" + result_class);
                                 if (!style_element && !element.checked) {
                                     style_element = document.createElement("style");
                                     style_element.id = "hide-" + result_class;
                                     style_element.innerHTML = "table#results > tbody > tr."+result_class+"{display:none}";
                                     document.body.appendChild(style_element);
                                 } else if (style_element && element.checked) {
                                     style_element.parentNode.removeChild(style_element);
                                 }
                             });
                });

        var template = ["section", {},
                        ["h2", {}, "Details"],
                        ["table", {"id":"results"},
                        ["tr", {},
                         ["th", {}, "Result"],
                         ["th", {}, "Test Name"],
                         ["th", {}, "Message"]
                        ],
                        ["tbody", {},
                        function(vars) {
                            var rv = map(vars.tests, function(test) {
                                             var status = status_text[test.status];
                                             return  ["tr", {"class":status_class(status)},
                                                      ["td", {}, status],
                                                      ["td", {}, test.name],
                                                      ["td", {}, test.message ? test.message : " "]
                                                     ];
                                         });
                            return rv;
                        }]
                       ]];

        log.appendChild(render(template, {tests:tests}));

    }


    /*
     * Template code
     *
     * A template is just a javascript structure. An element is represented as:
     *
     * [tag_name, {attr_name:attr_value}, child1, child2]
     *
     * the children can either be strings (which act like text nodes), other templates or
     * functions (see below)
     *
     * A text node is represented as
     *
     * ["{text}", value]
     *
     * String values have a simple substitution syntax; ${foo} represents a variable foo.
     *
     * It is possible to embed logic in templates by using a function in a place where a
     * node would usually go. The function must either return part of a template or null.
     *
     * In cases where a set of nodes are required as output rather than a single node
     * with children it is possible to just use a list
     * [node1, node2, node3]
     *
     * Usage:
     *
     * render(template, substitutions) - take a template and an object mapping
     * variable names to parameters and return either a DOM node or a list of DOM nodes
     *
     * substitute(template, substitutions) - take a template and variable mapping object,
     * make the variable substitutions and return the substituted template
     *
     */

    function is_single_node(template)
    {
        return typeof template[0] === "string";
    }

    function substitute(template, substitutions)
    {
        if (typeof template === "function") {
            var replacement = template(substitutions);
            if (replacement)
            {
                var rv = substitute(replacement, substitutions);
                return rv;
            }
            else
            {
                return null;
            }
        }
        else if (is_single_node(template))
        {
            return substitute_single(template, substitutions);
        }
        else
        {
            return filter(map(template, function(x) {
                                  return substitute(x, substitutions);
                              }), function(x) {return x !== null;});
        }
    }

    function substitute_single(template, substitutions)
    {
        var substitution_re = /\${([^ }]*)}/g;

        function do_substitution(input) {
            var components = input.split(substitution_re);
            var rv = [];
            for (var i=0; i<components.length; i+=2)
            {
                rv.push(components[i]);
                if (components[i+1])
                {
                    rv.push(String(substitutions[components[i+1]]));
                }
            }
            return rv;
        }

        var rv = [];
        rv.push(do_substitution(String(template[0])).join(""));

        if (template[0] === "{text}") {
            substitute_children(template.slice(1), rv);
        } else {
            substitute_attrs(template[1], rv);
            substitute_children(template.slice(2), rv);
        }

        function substitute_attrs(attrs, rv)
        {
            rv[1] = {};
            for (var name in template[1])
            {
                if (attrs.hasOwnProperty(name))
                {
                    var new_name = do_substitution(name).join("");
                    var new_value = do_substitution(attrs[name]).join("");
                    rv[1][new_name] = new_value;
                };
            }
        }

        function substitute_children(children, rv)
        {
            for (var i=0; i<children.length; i++)
            {
                if (children[i] instanceof Object) {
                    var replacement = substitute(children[i], substitutions);
                    if (replacement !== null)
                    {
                        if (is_single_node(replacement))
                        {
                            rv.push(replacement);
                        }
                        else
                        {
                            extend(rv, replacement);
                        }
                    }
                }
                else
                {
                    extend(rv, do_substitution(String(children[i])));
                }
            }
            return rv;
        }

        return rv;
    }

    function make_dom_single(template)
    {
        if (template[0] === "{text}")
        {
            var element = document.createTextNode("");
            for (var i=1; i<template.length; i++)
            {
                element.data += template[i];
            }
        }
        else
        {
            var element = document.createElement(template[0]);
            for (var name in template[1]) {
                if (template[1].hasOwnProperty(name))
                {
                    element.setAttribute(name, template[1][name]);
                }
            }
            for (var i=2; i<template.length; i++)
            {
                if (template[i] instanceof Object)
                {
                    var sub_element = make_dom(template[i]);
                    element.appendChild(sub_element);
                }
                else
                {
                    var text_node = document.createTextNode(template[i]);
                    element.appendChild(text_node);
                }
            }
        }

        return element;
    }



    function make_dom(template, substitutions)
    {
        if (is_single_node(template))
        {
            return make_dom_single(template);
        }
        else
        {
            return map(template, function(x) {
                           return make_dom_single(x);
                       });
        }
    }

    function render(template, substitutions)
    {
        return make_dom(substitute(template, substitutions));
    }

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

    function make_message(function_name, description, error, substitutions)
    {
        for (var p in substitutions) {
            if (substitutions.hasOwnProperty(p)) {
                substitutions[p] = format_value(substitutions[p]);
            }
        }
        var node_form = substitute(["{text}", "${function_name}: ${description}" + error],
                                   merge({function_name:function_name,
                                          description:(description?description + " ":"")},
                                          substitutions));
        return node_form.slice(1).join("");
    }

    function filter(array, callable, thisObj) {
        var rv = [];
        for (var i=0; i<array.length; i++)
        {
            if (array.hasOwnProperty(i))
            {
                var pass = callable.call(thisObj, array[i], i, array);
                if (pass) {
                    rv.push(array[i]);
                }
            }
        }
        return rv;
    }

    function map(array, callable, thisObj)
    {
        var rv = [];
        rv.length = array.length;
        for (var i=0; i<array.length; i++)
        {
            if (array.hasOwnProperty(i))
            {
                rv[i] = callable.call(thisObj, array[i], i, array);
            }
        }
        return rv;
    }

    function extend(array, items)
    {
        Array.prototype.push.apply(array, items);
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

    function merge(a,b)
    {
        var rv = {};
        var p;
        for (p in a)
        {
            rv[p] = a[p];
        }
        for (p in b) {
            rv[p] = b[p];
        }
        return rv;
    }

    function expose(object, name)
    {
        var components = name.split(".");
        var target = window;
        for (var i=0; i<components.length - 1; i++)
        {
            if (!(components[i] in target))
            {
                target[components[i]] = {};
            }
            target = target[components[i]];
        }
        target[components[components.length - 1]] = object;
    }

})();
// vim: set expandtab shiftwidth=4 tabstop=4:
