/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var props = {output:%(output)d};

setup(props);

add_completion_callback(function() {
    add_completion_callback(function (tests, status) {
        var results_element = document.createElement("script");
        results_element.type = "text/json";
        results_element.id = "__testharness__results__";
        var test_results = tests.map(function(x) {
            return {name:x.name, status:x.status, message:x.message, stack:x.stack}
        });
        data = {tests:test_results,
                status: status.status,
                message: status.message,
                stack: status.stack};
        results_element.textContent = JSON.stringify(data);
        document.documentElement.lastChild.appendChild(results_element);
    })
});
