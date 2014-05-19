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
      assert_equals(xhr.response, expected_requests);
      setTimeout(this.step_func_done(), 250); // delay done to fail for unexpected events
    });
    xhr.send();
  };
}

function check_props(obj, props) {
  for (p in props) {
    assert_equals(obj[p], props[p], p);
  }
}

// Measure round-trip time for more stable results in slow network situations.
// Only tests with a delay check the timeline.
var rtt = 0;
if (document.title.match(/(before|after) dimensions/)) {
  setTimeout(function() {
    var img = new Image();
    var start = new Date();
    img.src = '/images/green-1x1.png?' + (start - 0) + Math.random();
    img.onload = function() {
      rtt = new Date() - start;
    };
  }, 100);
}

function check_timeline(timeline, expected) {
  var len = timeline.length - 1;
  var epsilon = 250 + Math.ceil(rtt / 2);
  for (var i = 0; i < len; ++i) {
    assert_approx_equals(timeline[i + 1] - timeline[i], expected[i] + rtt, epsilon,
    'timeline ' + i + ' should be ~' + expected[i] + 'ms (plus RTT)');
  }
}
