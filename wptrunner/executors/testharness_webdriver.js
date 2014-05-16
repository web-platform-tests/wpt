/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var callback = arguments[arguments.length - 1];
window.timeout_multiplier = %(timeout_multiplier)d;

function listener(e) {
    if (e.data.type == "complete") {
        clearTimeout(timer);
        removeEventListener("message", listener);
        var test_results = e.data.tests.map(function(x) {
            return {name:x.name, status:x.status, message:x.message}
        });
        callback({test:"%(url)s",
                  tests:test_results,
                  status: e.data.status.status,
                  message: e.data.status.message});
    }
}
addEventListener("message", listener, false);

window.win = window.open("%(abs_url)s", "%(window_id)s");

var timer = setTimeout(function() {
    window.win.timeout();
}, %(timeout)s);
