test(function() {
  assert_true((performance !== undefined), "[Global].performance exists");
  assert_equals(typeof performance, "object", "[Global].performance is an object");
  assert_equals((typeof performance.now), "function", "[Global].performance.now() is a function");
  assert_equals(typeof performance.now(), "number", "[Global].performance.now() returns a number");
}, "[Global].performance.now() is a function that returns a number");

test(function() {
  assert_true(performance.now() > 0);
}, "[Global].performance.now() returns a positive number");

test(function() {
    var now1 = performance.now();
    var now2 = performance.now();
    assert_true((now2-now1) >= 0);
  }, "[Global].performance.now() difference is not negative");

async_test(function() {
  // Check whether the performance.now() method is close to Date() within 30ms (due to inaccuracies)
  var initial_hrt = performance.now();
  var initial_date = Date.now();
  this.step_timeout(function() {
    var final_hrt = performance.now();
    var final_date = Date.now();
    assert_approx_equals(final_hrt - initial_hrt, final_date - initial_date, 30, 'High resolution time value increased by approximately the same amount as time from date object');
    this.done();
  }, 2000);
}, 'High resolution time has approximately the right relative magnitude');
