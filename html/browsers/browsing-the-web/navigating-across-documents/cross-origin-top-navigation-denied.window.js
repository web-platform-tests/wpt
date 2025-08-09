// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: variant=?parent_user_gesture=true
// META: variant=?parent_user_gesture=false

let description = 'Cross-origin top navigation is blocked without user activation';
const urlParams = new URLSearchParams(location.search);
const parentUserGesture = urlParams.get('parent_user_gesture') || 'false';
if (parentUserGesture === 'true') {
  description += ', even if the parent has user activation';
}

async_test(t => {
  addEventListener('message', t.step_func_done(e => {
    assert_equals(e.data, 'Denied');
  }));
  const w = open(`resources/page-with-top-navigating-iframe.html?parent_user_gesture=${parentUserGesture}`);
  t.add_cleanup(() => {w.close()});
}, description);
