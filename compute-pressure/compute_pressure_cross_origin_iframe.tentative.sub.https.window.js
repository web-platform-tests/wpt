'use strict';

promise_test(async t => {
  var iframe = document.createElement('iframe');
  document.body.appendChild(iframe);

  var message_promise = new Promise((resolve, reject) => {
    window.addEventListener('message', e => {
      assert_equals(e.data, 'Security error. Make sure the page is visible and that observation is not requested from a cross-origin or fenced frame.');
      resolve();
    });

    iframe.src = 'https://{{hosts[alt][]}}:{{ports[https][0]}}/compute-pressure/resources/cross-origin-subframe.https.html';
  });

  await message_promise;
}, "PresureObserver.observe() fails in a cross origin iframe");

