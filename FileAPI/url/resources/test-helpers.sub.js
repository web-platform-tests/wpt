function with_iframe(url) {
  return new Promise(resolve => {
    const frame = document.createElement('iframe');
    frame.setAttribute('style', 'display:none;');
    frame.src = url;
    frame.onload = function() { resolve(frame); };
    document.body.appendChild(frame);
    add_completion_callback(() => { frame.remove(); });
  });
}

const DEFAULT_REMOTE_ORIGIN = '//{{domains[www1]}}:{{location[port]}}';

// Returns a promise that resolves with a blob URL for the specified blob
// on the specified origin.
function create_cross_origin_url(t, blob, origin = DEFAULT_REMOTE_ORIGIN) {
  return with_iframe(origin + '/FileAPI/url/resources/create-helper.html')
  .then(frame => {
    frame.contentWindow.postMessage({blob: blob}, '*');

    return new Promise(resolve => {
      self.addEventListener('message', t.step_func(e => {
        if (e.source === frame.contentWindow) {
          resolve(e.data.url);
        }
      }))
    });
  });
}
