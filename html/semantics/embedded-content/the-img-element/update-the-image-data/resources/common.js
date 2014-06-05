function make_url(settings) {
  var uuid = token();
  var url = 'resources/stash-count-requests.py?id=' + uuid;
  for (var key in settings) {
    url += '&' + key + '=' + settings[key];
  }
  url += '&action=';
  return url;
}

function check_requests(url, expected_requests) {
  return function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = this.step_func(function() {
      assert_equals(xhr.response, expected_requests, 'check_requests');
      setTimeout(this.step_func_done(), 250); // delay done to fail for unexpected events
    });
    xhr.send();
  };
}

var expected_props = {
  'before dimensions': {width: 0, complete: false},
  'after dimensions': {width: 1, complete: false},
  'loaded': {width: 1, complete: true},
  'error': {width: 0, complete: true},
};

for (var state in expected_props) {
  ['height', 'naturalWidth', 'naturalHeight'].forEach(function(p) {
    expected_props[state][p] = expected_props[state].width;
  });
}

function check_props(obj, state, msg) {
  msg = msg || '';
  var props = expected_props[state];
  for (p in props) {
    assert_equals(obj[p], props[p], 'check_props ' + msg + ' (' + state + '), ' + p);
  }
}

function check_timeline(timeline, expected) {
  var len = timeline.length - 1;
  var epsilon = 250 + Math.ceil(rtt / 2);
  for (var i = 0; i < len; ++i) {
    assert_approx_equals(timeline[i + 1] - timeline[i], expected[i] + rtt, epsilon,
    'check_timeline ' + i + ' should be ~' + expected[i] + 'ms (plus RTT)');
  }
}
