/**
 * Each test run gets its own URL and randomized content and operates independently.
 *
 * Tests are an array of objects, each representing a request to make and check.
 * The cache.py server script stashes an entry containing observed headers for
 * each request it receives.  When the test fetches have run, this state is retrieved
 * and the expected_* lists are checked, including their length.
 *
 * Request object keys:
 * - template - A template object for the request, by name -- see "templates" below.
 * - request_method - A string containing the HTTP method to be used.
 * - request_headers - An array of [header_name_string, header_value_string] arrays to
 *                     emit in the request.
 * - request_body - A string to use as the request body.
 * - mode - The mode string to pass to fetch().
 * - credentials - The credentials string to pass to fetch().
 * - cache - The cache string to pass to fetch().
 * - pause_after - Boolean controlling a 3-second pause after the request completes.
 * - response_status - A [number, string] array containing the HTTP status code
 *                     and phrase to return.
 * - response_headers - An array of [header_name_string, header_value_string] arrays to
 *                      emit in the response. These values will also be checked like
 *                      expected_response_headers, unless there is a third value that is
 *                      false.
 * - response_body - String to send as the response body. If not set, it will contain
 *                   the test identifier.
 * - expected_type - One of ["cached", "not_cached", "lm_validate", "etag_validate", "error"]
 * - expected_status - A number representing a HTTP status code to check the response for.
 *                     If not set, the value of response_status[0] will be used; if that
 *                     is not set, 200 will be used.
 * - expected_request_headers - An array of [header_name_string, header_value_string] representing
 *                               headers to check the request for.
 * - expected_response_headers - An array of [header_name_string, header_value_string] representing
 *                               headers to check the response for. See also response_headers.
 * - expected_response_text - A string to check the response body against.
 */

function make_url(uuid, info, idx) {
  var arg = "";
  if ("query_arg" in info[idx]) {
    arg = "&target=" + info[idx].query_arg;
  }
  return "resources/http-cache.py?token=" + uuid + "&info=" + btoa(JSON.stringify(info)) + arg;
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
  },
  "lcl_response": {
    "response_headers": [
      ['Location', "location_target"],
      ['Content-Location', "content_location_target"]
    ]
  },
  "location": {
    "query_arg": "location_target",
    "response_headers": [
      ['Expires', http_date(100000)],
      ['Last-Modified', http_date(0)]
    ]
  },
  "content_location": {
    "query_arg": "content_location_target",
    "response_headers": [
      ['Expires', http_date(100000)],
      ['Last-Modified', http_date(0)]
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
    var fetch_functions = [];
    for (var i = 0; i < requests.length; ++i) {
      fetch_functions.push({
        code: function(idx) {
          var init = {};
          var url = make_url(uuid, requests, idx);
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
            init.cache = config["cache"];
          }
          return fetch(url, init)
            .then(function(response) {
              var request_count = parseInt(response.headers.get("Server-Request-Count")) - 1;
              if ("expected_type" in config) {
                if (config.expected_type === "error") {
                  assert_true(false, "fetch should have been an error");
                  return [response.text(), response_status];
                }
                if (config.expected_type === "cached") {
                  assert_true(request_count < idx, "Cached response used");
                }
                if (config.expected_type === "not_cached") {
                  assert_false(request_count < idx, "Cached response used");
                }
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
  	    step_timeout(function() {
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
          var expected_validating_headers = []
          if ("expected_type" in requests[i]) {
            if (requests[i].expected_type === "cached") {
              assert_true(state.length <= i, "cached response used");
              break;
            }
            if (requests[i].expected_type === "not_cached") {
              assert_false(state.length <= i, "cached response used");
            }
            if (requests[i].expected_type === "etag_validated") {
              expected_validating_headers.push('if-none-match')
            }
            if (requests[i].expected_type === "lm_validated") {
              expected_validating_headers.push('if-modified-since')
            }
          }
          for (var j in expected_validating_headers) {
              var vhdr = expected_validating_headers[j];
            assert_own_property(state[i].request_headers, vhdr, " has " + vhdr + " request header");
          }
          if ("expected_request_headers" in requests[i]) {
            var expected_request_headers = requests[i].expected_request_headers;
            for (var j = 0; j < expected_request_headers.length; ++j) {
              var expected_header = expected_request_headers[j];
              assert_equals(state[i].request_headers[expected_header[0].toLowerCase()],
                            expected_header[1]);
            }
          }
        }
      });
  };
}


function run_tests(tests)
{
  tests.forEach(function(info) {
    promise_test(make_test(info.requests), info.name);
  });
}

function http_date(delta) {
  return new Date(Date.now() + (delta * 1000)).toGMTString();
}

function http_content() {
  btoa(Math.random() * Date.now());
}