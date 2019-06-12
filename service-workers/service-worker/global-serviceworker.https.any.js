// META: title=serviceWorker on service worker global
// META: global=!default,serviceworker

test(() => {
  assert_equals(registration.installing, null, 'registration.installing');
  assert_equals(registration.waiting, null, 'registration.waiting');
  assert_equals(registration.active, null, 'registration.active');
  assert_true('serviceWorker' in self, 'self.serviceWorker exists');
  assert_equals(serviceWorker.state, 'parsed', 'serviceWorker.state');
}, 'First run');

async_test((t) => {
  assert_true('serviceWorker' in self, 'self.serviceWorker exists');
  serviceWorker.postMessage({ messageTest: true });

  addEventListener('message', t.step_func((event) => {
    if (!event.data.messageTest) return;
    assert_equals(event.source, serviceWorker, 'event.source');
    t.done();
  }));
}, 'Can post message to self during startup');

async_test((t) => {
  addEventListener('install', t.step_func_done(() => {
    assert_true('serviceWorker' in self, 'self.serviceWorker exists');
    assert_equals(registration.installing, serviceWorker, 'registration.installing');
    assert_equals(registration.waiting, null, 'registration.waiting');
    assert_equals(registration.active, null, 'registration.active');
    assert_equals(serviceWorker.state, 'installing', 'serviceWorker.state');
  }));
}, 'During install');

async_test((t) => {
  addEventListener('activate', t.step_func_done(() => {
    assert_true('serviceWorker' in self, 'self.serviceWorker exists');
    assert_equals(registration.installing, null, 'registration.installing');
    assert_equals(registration.waiting, null, 'registration.waiting');
    assert_equals(registration.active, serviceWorker, 'registration.active');
    assert_equals(serviceWorker.state, 'activating', 'serviceWorker.state');
  }));
}, 'During activate');
