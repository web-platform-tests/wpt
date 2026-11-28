// META: script=resources/test-helpers.sub.js

// We can't really detect when a cross origin navigation has failed, so instead
// detect when it succeeds, and assume it failed if it didn't succeed before
// this timeout. All tests in this file as async_test rather than promise_test
// to make sure these timeouts at least overlap, and prevent the whole file from
// taking a very long time.
const load_timeout = 3000;

// Rejection-specific helper that provides more details
function unreached_rejection(test, prefix) {
  return test.step_func(function(error) {
      var reason = error.message || error.name || error;
      assert_unreached('Unexpected rejection: ' + reason);
    });
}

async_test(t => {
  const blob_contents = 'hello world';
  const blob = new Blob([blob_contents], {type: 'text/html'});
  create_cross_origin_url(t, blob)
    .then(url => with_iframe(url))
    .then(t.unreached_func('Loading should have failed'))
    .catch(unreached_rejection(t));
  t.step_timeout(t.step_func_done(), load_timeout);
}, 'Can not load a cross-origin blob URL in an iframe.');

function receive_message_on_cross_origin_channel(t, channel_name) {
  return with_iframe(DEFAULT_REMOTE_ORIGIN +
                     '/FileAPI/url/resources/bcchannel-forwarder.html?' +
                     channel_name)
    .then(frame => {
      return new Promise(resolve => {
        self.addEventListener('message', t.step_func(e => {
          if (e.source === frame.contentWindow)
            resolve(e.data);
        }));
      });
    });
}

function window_contents_for_channel(channel_name) {
  return '<!doctype html>\n' +
    '<script>\n' +
    'new BroadcastChannel("' + channel_name + '").postMessage("foobar");\n' +
    'self.close();\n' +
    '</script>';
}

async_test(t => {
  const channel_name = 'cross-origin-iframe';
  const blob_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([blob_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'))
    .catch(unreached_rejection(t));
  with_iframe('/common/blank.html')
    .then(frame => {
      return create_cross_origin_url(t, blob)
        .then(url => {
          frame.contentWindow.location = url;
        });
    }).catch(unreached_rejection(t));
  t.step_timeout(t.step_func_done(), load_timeout);
}, 'Can not navigate an iframe to a cross-origin blob URL.');

async_test(t => {
  const channel_name = 'cross-origin-window';
  const window_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([window_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'))
    .catch(unreached_rejection(t));
  create_cross_origin_url(t, blob)
    .then(url => {
      const win = window.open(url, 'blank_');
      add_completion_callback(() => { win.close(); });
    }).catch(unreached_rejection(t));
  t.step_timeout(t.step_func_done(), load_timeout);
}, 'Can not load a cross-origin blob URL in a window.');

async_test(t => {
  const channel_name = 'navigate-cross-origin-window';
  const blob_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([blob_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'))
    .catch(unreached_rejection(t));
  create_cross_origin_url(t, blob)
    .then(url => {
      const win = window.open('/common/blank.html');
      add_completion_callback(() => { win.close(); });
      win.onload = t.step_func(() => {
        win.location = url;
      });
    }).catch(unreached_rejection(t));
  t.step_timeout(t.step_func_done(), load_timeout);
}, 'Can not navigate a window to a cross-origin blob URL.');


async_test(t => {
  const channel_name = 'cross-origin-window-noopener';
  const window_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([window_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'))
    .catch(unreached_rejection(t));
  create_cross_origin_url(t, blob)
    .then(url => window.open(url, 'blank_', 'noopener'))
    .catch(unreached_rejection(t));
  t.step_timeout(t.step_func_done(), load_timeout);
}, 'Can not load a cross-origin blob URL in a no-opener window.');
