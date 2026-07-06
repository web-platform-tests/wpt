let resolver = null;
let rejecter = null;

self.addEventListener('canmakepayment', event => {
  event.respondWith(true);
});

self.addEventListener('paymentrequest', event => {
  event.respondWith(new Promise((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;

    // Get UUID from method data
    const uuid = event.methodData[0].data.uuid;
    const url = `payment-app/open-window-demo.html?uuid=${uuid}`;

    event.openWindow(url).catch(err => {
      resolver = null;
      rejecter = null;
      reject(err);
    });
  }));
});

self.addEventListener('message', msgEvent => {
  if (msgEvent.data === 'success') {
     resolver({
       methodName: event.methodData[0].supportedMethods,
       details: {status: 'success'},
     });
  }
});
