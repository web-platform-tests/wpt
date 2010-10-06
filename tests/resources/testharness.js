/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

/*
 * == Introducion ==
 * This file provides a framework for writing testcases. It is intended
 * to provide a convenient API for making common assertions, and to work
 * both for testing synchronous and asynchronous DOM features in a way that
 * promotes clear, robust, tests.
 *
 * == Basic Usage ==
 *
 * To use this file, import the script into the test document:
 * <script src="http://test.w3.org/resources/jsharness.js"></script>
 *
 * Within each file one may define one or more tests. Each test is atomic
 * in the sense that a single test has a single result (pass/fail/timeout).
 * Within each test one may have a number of asserts. The test fails at the
 * first failing assert, and the remainder of the test is (typically) not run
 *
 * If the file containing the tests is a HTML file with an element of id "log"
 * this will be populated with a table containing the test results after all
 * the tests have run.
 *
 * == Synchronous Tests ==
 *
 * To create a sunchronous test use the test() function:
 *
 * test(test_function, name)
 *
 * test_function is a function that contains the code to test. For example a
 * trivial passing test would be:
 *
 * test(function() {assert_true(true)}, "assert_true with true)"
 *
 * The function passed in is run in the test() call.
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
 * == Making assertions ==
 *
 * Functions for making assertions start assert_
 * The best way to get a list is to look in this file for functions names
 * matching that pattern. The general signature is
 *
 * assert_something(actual, expected, description)
 *
 * although not all assertions precisely match this pattern e.g. assert_true only
 * takes actual and description as arguments.
 *
 * The description parameter is used to present more useful error messages when a
 * test fails
 */

(function ()
{
    var debug = false;
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
        if (test_obj.status === null) {
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

    function assert_equals(actual, expected, description)
    {
         /*
          * Test if two primitives are equal or two objects
          * are the same object
          */
         var message = make_message("assert_equals", description,
                                    [["{text}", "expected "],
                                     ["span", {"class":"expected"}, String(expected)],
                                     ["{text}", "got "],
                                     ["span", {"class":"actual"}, String(actual)]]);
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
    };
    expose(assert_equals, "assert_equals");

    function assert_object_equals(actual, expected, description)
    {
         //This needs to be improved a great deal
         function check_equal(expected, actual, stack)
         {
             stack.push(actual);

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

    function assert_exists(object, property_name, description)
    {
         var message = make_message(
             "assert_exists", description,
             "expected property ${p} missing", {p:property_name});

         assert(object.hasOwnProperty(property_name), message);
    };
    expose(assert_exists, "assert_exists");

    function assert_not_exists(object, property_name, description)
    {
         var message = make_message(
             "assert_not_exists", description,
             "unexpected property ${p} found", {p:property_name});

         assert(!object.hasOwnProperty(property_name), message);
    };
    expose(assert_not_exists, "assert_not_exists");

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

    function assert_throws(code_or_object, func, description)
    {
        try
        {
            func.call(this);
            assert(false, make_message("assert_throws", description,
                                      "${func} did not throw", {func:String(func)}));
        }
        catch(e)
        {
            if (e instanceof AssertionError) {
                throw(e);
            }
            if (typeof code_or_object === "string")
            {
                assert(e[code_or_object] !== undefined &&
                       e.code === e[code_or_object] &&
                       e.name === code_or_object,
                       make_message("assert_throws", description,
                           [["{text}", "${func} threw with"] ,
                            function()
                            {
                                var actual_name;
                                for (var p in DOMException)
                                {
                                    if (e.code === DOMException[p])
                                    {
                                        actual_name = p;
                                        break;
                                    }
                                }
                                if (actual_name)
                                {
                                    return ["{text}", " code " + actual_name + " (${actual_number})"];
                                }
                                else
                                {
                                    return ["{text}", " error number ${actual_number}"];
                                }
                            },
                            ["{text}"," expected ${expected}"],
                            function()
                            {
                                return e[code_or_object] ?
                                    ["{text}", " (${expected_number})"] : null;
                            }
                           ],
                                    {func:String(func), actual_number:e.code,
                                     expected:String(code_or_object),
                                     expected_number:e[code_or_object]}));
                assert(e instanceof DOMException,
                      make_message("assert_throws", description,
                                   "thrown exception ${exception} was not a DOMException",
                                  {exception:String(e)}));
            }
            else
            {
                assert(e instanceof Object && "name" in e && e.name == code_or_object.name,
                       make_message("assert_throws", description,
                           "${func} threw ${actual} (${actual_name}) expected ${expected} (${expected_name})",
                                    {func:String(func), actual:String(e), actual_name:e.name,
                                     expected:String(code_or_object),
                                     expected_name:code_or_object.name}));
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
       this.status = null;
       var timeout = default_timeout;
       this.is_done = false;

       if (properties.timeout)
       {
           timeout = properties.timeout;
       }

       this.message = null;

       var this_obj = this;
       this.steps = [];
       this.timeout_id = setTimeout(function() { this_obj.timeout(); }, timeout);

       tests.push(this);
   }

    Test.prototype.step = function(func, this_obj)
    {
        //In case the test has already failed
        if (this.status !== null)
        {
          return;
        }

        this.steps.push(func);

        try
        {
            func.apply(this_obj);
        }
        catch(e)
        {
            //This can happen if something called synchronously invoked another
            //step
            if (this.status !== null)
            {
                return;
            }
            this.status = status.FAIL;
            this.message = e.message;
            this.done();
            if (debug) {
                throw e;
            }
        }
    };

    Test.prototype.timeout = function()
    {
        this.status = status.TIMEOUT;
        this.timeout_id = null;
        this.message = "Test timed out";
        this.done();
    };

    Test.prototype.done = function()
    {
        if (this.is_done) {
            //Using alert here is bad
            return;
        }
        clearTimeout(this.timeout_id);
        if (this.status == null)
        {
            this.status = status.PASS;
        }
        this.is_done = true;
        tests.done(this);
    };


   /*
    * Harness
    */
    var tests = new Tests();

    function Tests()
    {
        this.tests = [];
        this.num_pending = 0;
        this.started = false;

        this.start_callbacks = [];
        this.test_done_callbacks = [];
        this.all_done_callbacks = [];

        var this_obj = this;

        //All tests can't be done until the load event fires
        this.all_loaded = false;

        on_event(window, "load",
                 function()
                 {
                     this_obj.all_loaded = true;
                     if (document.getElementById("log"))
                     {
                         add_completion_callback(output_results);
                     }
                     if (this_obj.all_done())
                     {
                         this_obj.notify_results();
                     }
                 });
   }

    Tests.prototype.push = function(test)
    {
        if (!this.started) {
            this.start();
        }
        this.num_pending++;
        this.tests.push(test);
    };

    Tests.prototype.all_done = function() {
        return this.all_loaded && this.num_pending == 0;
    };

    Tests.prototype.done = function(test)
    {
        this.num_pending--;
        var this_obj = this;
        forEach(this.test_done_callbacks,
                function(callback)
                {
                    callback(test, this_obj);
                });

        if(top !== window && top.result_callback)
        {
            top.result_callback.call(test, this_obj);
        }

        if (this.all_done())
        {
            this.notify_results();
        }

    };

    Tests.prototype.start = function() {
        this.started = true;
        var this_obj = this;
        forEach (this.start_callbacks,
                 function(callback)
                 {
                     callback(this_obj);
                 });
        if(top !== window && top.start_callback)
        {
            top.start_callback.call(this_obj);
        }
    };

    Tests.prototype.notify_results = function()
    {
        var this_obj = this;

        forEach (this.all_done_callbacks,
                 function(callback)
                 {
                     callback(this_obj.tests);
                 });
        if(top !== window && top.completion_callback)
        {
            top.completion_callback.call(this_obj, this_obj.tests);
        }
    };

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

    function output_results(tests)
    {
        var log = document.getElementById("log");
        while (log.lastChild) {
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
        status_text[status.PASS] = "Pass";
        status_text[status.FAIL] = "Fail";
        status_text[status.TIMEOUT] = "Timeout";

        var template = ["table", {"id":"results"},
                        ["tr", {},
                         ["th", {}, "Result"],
                         ["th", {}, "Test Name"],
                         ["th", {}, "Message"]
                        ],
                        function(vars) {
                            var rv = map(vars.tests, function(test) {
                                             var status = status_text[test.status];
                                             return  ["tr", {},
                                                      ["td", {"class":status.toLowerCase()}, status],
                                                      ["td", {}, test.name],
                                                      ["td", {}, test.message ? test.message : " "]
                                                     ];
                                         });
                            return rv;
                        }
                       ];

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
    expose(substitute, "template.substitute");

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
                    rv.push(substitutions[components[i+1]]);
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
            for (name in template[1])
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
            for (name in template[1]) {
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
    expose(render, "template.render");

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
        var message = substitute([["span", {"class":"assert"}, "${function_name}:"],
                                  function()
                                  {
                                      if (description) {
                                          return ["span", {"class":"description"}, description];
                                      } else {
                                          return null;
                                      }
                                  },
                                  ["div", {"class":"error"}, error]
                                 ], merge({function_name:function_name},
                                         substitutions));

        return message;
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