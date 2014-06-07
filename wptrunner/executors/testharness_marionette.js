/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

window.wrappedJSObject.timeout_multiplier = %(timeout_multiplier)d;

function listener(e) {
    if (e.data.type == "complete") {
        clearTimeout(timer);
        removeEventListener("message", listener);
        var test_results = e.data.tests.map(function(x) {
            return {name:x.name, status:x.status, message:x.message}
        });
        window.wrappedJSObject.win.close();
        marionetteScriptFinished({test:"%(url)s",
                                  tests:test_results,
                                  status: e.data.status.status,
                                  message: e.data.status.message});
    }
}
addEventListener("message", listener, false);

window.wrappedJSObject.win = window.open("%(abs_url)s", "%(window_id)s");

var timer = setTimeout(function() {
    log("Timeout fired");
    window.wrappedJSObject.win.timeout();
    window.wrappedJSObject.win.close();
}, %(timeout)s);
