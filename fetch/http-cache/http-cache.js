/**
 * Each test run gets its own URL and randomized content and operates
 * independently.
 *
 * The test steps are run with request_cache.length fetch requests issued
 * and their immediate results sanity-checked.  The cache.py server script
 * stashes an entry containing any If-None-Match, If-Modified-Since, Pragma,
 * and Cache-Control observed headers for each request it receives.  When
 * the test fetches have run, this state is retrieved from cache.py and the
 * expected_* lists are checked, including their length.
 *
 * This means that if a request_* fetch is expected to hit the cache and not
 * touch the network, then there will be no entry for it in the expect_*
 * lists.  AKA (request_cache.length - expected_validation_headers.length)
 * should equal the number of cache hits that didn't touch the network.
 *
 * Request object keys:
 * - template
 * - request_method
 * - request_headers
 * - request_body
 * - mode
 * - credentials
 * - cache
 * - pause_after
 * - response_status
 * - response_headers
 * - response_body
 * - expected_type
 * - expected_status
 * - expected_response_headers
 * - expected_response_text
 */

function make_url(uuid, info) {
    return "resources/http-cache.py?token=" + uuid + "&info=" + btoa(JSON.stringify(info));
}

function server_state(uuid) {
  return fetch("resources/http-cache.py?querystate&token=" + uuid)
    .then(function(response) {
      return response.text();
    }).then(function(text) {
      // null will be returned if the server never received any requests
      // for the given uuid.  Normalize that to an empty list consistent
      // with our representation.
      return JSON.parse(text) || [];
    });
}

templates = {
  "fresh": {
    "response_headers": [
      ['Expires', http_date(100000)],
      ['Last-Modified', http_date(0)]
    ]
  },
  "stale": {
    "response_headers": [
      ['Expires', http_date(-5000)],
      ['Last-Modified', http_date(-100000)]
    ]
  }
}

function make_test(raw_requests) {
  var requests = [];
  for (var i = 0; i < raw_requests.length; i++) {
    var request = raw_requests[i];
    if ("template" in request) {
      var template = templates[request["template"]];
      for (var member in template) {
        if (! request.hasOwnProperty(member)) {
          request[member] = template[member];
        }
      }
    }
    requests.push(request);
  }
  return function(test) {
    var uuid = token();
    var url = make_url(uuid, requests);
    var fetch_functions = [];
    for (var i = 0; i < requests.length; ++i) {
      fetch_functions.push({
        code: function(idx) {
          var init = {};
          var config = requests[idx];
          if ("request_method" in config) {
            init.method = config["request_method"];
          }
          if ("request_headers" in config) {
            init.headers = config["request_headers"];
          }
          if ("request_body" in config) {
            init.body = config["request_body"];
          }
          if ("mode" in config) {
            init.mode = config["mode"];
          }
          if ("credentials" in config) {
            init.mode = config["credentials"];
          }
          if ("cache" in config) {
            init.mode = config["cache"];
          }
          return fetch(url, init)
            .then(function(response) {
              if ("expected_type" in config && config.expected_type === "error") {
                assert_true(false, "fetch should have been an error");
                return [response.text(), response_status];
              }
              if ("expected_status" in config) {
                assert_equals(response.status, config.expected_status);
              } else if ("response_status" in config) {
                  assert_equals(response.status, config.response_status[0]);
              } else {
                assert_equals(response.status, 200)
              }
              if ("response_headers" in config) {
                config.response_headers.forEach(function(header) {
                  if (header.len < 3 || header[2] === true) {
                    assert_equals(response.headers.get(header[0]), header[1])
                  }
                })
              }
              if ("expected_response_headers" in config) {
                config.expected_response_headers.forEach(function(header) {
                  assert_equals(response.headers.get(header[0]), header[1]);
                });
              }
              return [response.text(), response.status];
            }).then(function(text, response_status) {
              if ("expected_response_text" in config) {
                assert_equals(text, config.expected_response_text);
              } else {
                if (! response_status in [204, 304]) {
                  assert_equals(text, uuid);
                }
              }
            }, function(reason) {
              if ("expected_type" in config && config.expected_type === "error") {
                assert_throws(new TypeError(), function() { throw reason; });
              } else {
                throw reason;
              }
            });
        },
        pause_after: "pause_after" in requests[i] && true || false
      });
    }

    function pause() {
      return new Promise(function(resolve, reject) {
  	    setTimeout(function() {
          return resolve()
        }, 3000);
      });
    }

    // TODO: it would be nice if this weren't serialised.
    var idx = 0;
    function run_next_step() {
      if (fetch_functions.length) {
        var fetch_function = fetch_functions.shift();
        if (fetch_function.pause_after > 0) {
          return fetch_function.code(idx++)
            .then(pause)
            .then(run_next_step);
        } else {
          return fetch_function.code(idx++)
            .then(run_next_step);
        }
      } else {
        return Promise.resolve();
      }
    }

    return run_next_step()
      .then(function() {
        // Now, query the server state
        return server_state(uuid);
      }).then(function(state) {
        for (var i = 0; i < requests.length; ++i) {
          if ("expected_type" in requests[i]) {
            if (requests[i].expected_type === "cached") {
              assert_true(state.length <= i, "cached response used");
              break;
            }
            if (requests[i].expected_type === "not_cached") {
              assert_true(state.length > i, "cached response not used");
              // TODO: look for signs of validation
            }
          }
          if ("expected_request_headers" in requests[i]) {
            for (var header in requests[i].expected_request_headers) {
              assert_equals(state[i].request_headers[header[0]], header[1]);
            }
          }
        }
      });
  };
}

// TODO
// generate an ETag
// generate content
// generate a date


function run_tests(tests)
{
  tests.forEach(function(info) {
    promise_test(make_test(info.requests), info.name);
  });
}

function http_date(delta) {
  return new Date(Date.now() + (delta * 1000)).toGMTString()
}
