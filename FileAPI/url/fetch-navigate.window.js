// META: script=resources/test-helpers.sub.js
// META: timeout=long

// We can't really detect when a cross origin navigation has failed, so instead
// detect when it succeeds, and assume it failed if it didn't succeed before
// this timeout.
const load_timeout = 2000;

promise_test(t => {
  const blob_contents = 'hello world';
  const blob = new Blob([blob_contents], {type: 'text/html'});
  return create_cross_origin_url(t, blob)
    .then(url => {
      with_iframe(url)
        .then(t.unreached_func('Loading should have failed'));
      return new Promise(resolve => {
        t.step_timeout(resolve, load_timeout);
      });
    });
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

promise_test(t => {
  const channel_name = 'cross-origin-iframe';
  const blob_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([blob_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'));;
  return with_iframe('/common/blank.html')
    .then(frame => {
      return create_cross_origin_url(t, blob)
        .then(url => {
          frame.contentWindow.location = url;
          return new Promise(resolve => {
            t.step_timeout(resolve, load_timeout);
          });
        });
    });
}, 'Can not navigate an iframe to a cross-origin blob URL.');

promise_test(t => {
  const channel_name = 'cross-origin-window';
  const window_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([window_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'));;
  return create_cross_origin_url(t, blob)
    .then(url => {
      const win = window.open(url, 'blank_');
      add_completion_callback(() => { win.close(); });
      return new Promise(resolve => {
        t.step_timeout(resolve, load_timeout);
      });
    });
}, 'Can not load a cross-origin blob URL in a window.');

promise_test(t => {
  const channel_name = 'navigate-cross-origin-window';
  const blob_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([blob_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'));;
  return create_cross_origin_url(t, blob)
    .then(url => {
      const win = window.open('/common/blank.html');
      add_completion_callback(() => { win.close(); });
      win.onload = t.step_func(() => {
        win.location = url;
      });
      return new Promise(resolve => {
        t.step_timeout(resolve, load_timeout);
      });
    });
}, 'Can not navigate a window to a cross-origin blob URL.');


promise_test(t => {
  const channel_name = 'cross-origin-window-noopener';
  const window_contents = window_contents_for_channel(channel_name);
  const blob = new Blob([window_contents], {type: 'text/html'});
  receive_message_on_cross_origin_channel(t, channel_name)
    .then(t.unreached_func('Loading should have failed'));;
  return create_cross_origin_url(t, blob)
    .then(url => {
      window.open(url, 'blank_', 'noopener');
      return new Promise(resolve => {
        t.step_timeout(resolve, load_timeout);
      });
    });
}, 'Can not load a cross-origin blob URL in a no-opener window.');
