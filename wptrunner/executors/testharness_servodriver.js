/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var callback = arguments[arguments.length - 1];

var results_id = "__testharness__results__";

function done() {
  clearTimeout(timer);
  callback(document.getElementById(results_id).textContent);
}

// Work around the fact that load isn't blocked on the scripts
// actually running
(function setup() {
  if (document.getElementById(results_id)) {
    done();
  } else {
    if (window.add_completion_callback) {
      add_completion_callback(function() {
        add_completion_callback(done);
      });
    } else {
      setTimeout(setup, 20);
    }
  }
})()

var timer = setTimeout(function() {
  timeout();
}, %(timeout)s);
