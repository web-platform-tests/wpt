/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
 */

"use strict";


var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';


function newHTMLDocument() {
    return document.implementation.createHTMLDocument('Test Document');
}

// Creates new iframe and loads given url into it.
// Returns reference to created iframe.
function newIFrame(url){
    assert_not_equals(url, null, 'argument url should not be null');
    var iframe = document.createElement('iframe');
    iframe.src = url;
    document.body.appendChild(iframe);
    return iframe;
}

// Creates new iframe and loads given url into it.
// Function f is bound to the iframe's onload event.
// Function f receives iframe's contentDocument as argument.
// The iframe is disposed after function f is executed.
function testInIFrame(url, f, testName, testProps) {
    var t = async_test(testName, testProps);
    t.step(function() {
        var iframe = newIFrame(url);
        iframe.onload = t.step_func(function() {
            try {
                f(iframe.contentDocument);
                t.done();
            } finally {
                iframe.parentNode.removeChild(iframe);
            }
        });
    });
}
