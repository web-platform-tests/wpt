/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var root = document.documentElement;
var observer = new MutationObserver(test);

function test(x) {
    log("classList: " + root.classList);
    if (!root.classList.contains("reftest-wait")) {
        observer.disconnect();
        marionetteScriptFinished();
    }
}

observer.observe(root, {attributes: true});
test();
