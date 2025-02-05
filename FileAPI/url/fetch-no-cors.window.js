// META: script=resources/test-helpers.sub.js

const blob_contents = 'test blob contents';
const test_blob = new Blob([blob_contents]);

promise_test(t => {
  return create_cross_origin_url(t, test_blob).then(url => {
    return promise_rejects(t, new TypeError, fetch(url));
  });
}, 'Can not fetch a cross-origin blob URL.');

promise_test(t => {
  return create_cross_origin_url(t, test_blob).then(url => {
    return promise_rejects(t, new TypeError, fetch(url, {mode: 'no-cors'}));
  });
}, 'Can not fetch a cross-origin blob URL even with no-cors.');

promise_test(t => {
  return fetch('/images/blue.png')
    .then(r => r.blob())
    .then(blob => create_cross_origin_url(t, blob))
    .then(url => {
      const img = new Image();
      img.src = url;
      return new Promise(resolve => {
        img.onload = t.unreached_func('Loading should have failed');
        img.onerror = resolve;
      });
    });
}, 'Can not fetch a cross-origin blob URL in an img tag.');
