/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
 */

//
// Helper Functions for FrameTiming W3C tests
//

var performanceNamespace = window.performance;

var namespace_check = false;

//
// All test() functions in the WebPerf test suite should use wp_test() instead.
//
// wp_test() validates the window.performance namespace exists prior to running tests and
// immediately shows a single failure if it does not.
//

function wp_test(func, msg, properties)
{
    // only run the namespace check once
    if (!namespace_check)
    {
        namespace_check = true;

        if (performanceNamespace === undefined || performanceNamespace == null)
        {
            // show a single error that window.performance is undefined
            test(function() { assert_true(performanceNamespace !== undefined && performanceNamespace != null, "window.performance is defined and not null"); }, "window.performance is defined and not null.", {author:"W3C http://www.w3.org/",help:"http://www.w3.org/TR/navigation-timing/#sec-window.performance-attribute",assert:"The window.performance attribute provides a hosting area for performance related attributes. "});
        }
    }

    test(func, msg, properties);
}

function test_namespace(child_name, skip_root)
{
    if (skip_root === undefined) {
        var msg = 'window.performance is defined';
        wp_test(function () { assert_true(performanceNamespace !== undefined, msg); }, msg,{author:"W3C http://www.w3.org/",help:"http://www.w3.org/TR/navigation-timing/#sec-window.performance-attribute",assert:"The window.performance attribute provides a hosting area for performance related attributes. "});
    }

    if (child_name !== undefined) {
        var msg2 = 'window.performance.' + child_name + ' is defined';
        wp_test(function() { assert_true(performanceNamespace[child_name] !== undefined, msg2); }, msg2,{author:"W3C http://www.w3.org/",help:"http://www.w3.org/TR/navigation-timing/#sec-window.performance-attribute",assert:"The window.performance attribute provides a hosting area for performance related attributes. "});
    }
}

//
// Common helper functions
//

function test_true(value, msg, properties)
{
    wp_test(function () { assert_true(value, msg); }, msg, properties);
}

function test_equals(value, equals, msg, properties)
{
    wp_test(function () { assert_equals(value, equals, msg); }, msg, properties);
}

function test_greater_than(value, greater_than, msg, properties)
{
    wp_test(function () { assert_greater_than(value, greater_than, msg); }, msg, properties);
}

function test_greater_or_equals(value, greater_than, msg, properties)
{
    wp_test(function () { assert_greater_than_equal(value, greater_than, msg); }, msg, properties);
}

function test_not_equals(value, notequals, msg, properties)
{
    wp_test(function() { assert_not_equals(value, notequals, msg); }, msg, properties);
}
