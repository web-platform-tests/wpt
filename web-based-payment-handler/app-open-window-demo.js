let resolver = null;
let rejecter = null;
let payment_request_event = null;

self.addEventListener('canmakepayment', event => {
  event.respondWith(true);
});

self.addEventListener('paymentrequest', event => {
  payment_request_event = event;
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
       methodName: payment_request_event.methodData[0].supportedMethods,
       details: {status: 'success'},
     });
  } else if (msgEvent.data === 'ready') {
    console.log("SW received ready, calling changePaymentMethod");
    if (payment_request_event) {
      payment_request_event.changePaymentMethod(
        payment_request_event.methodData[0].supportedMethods,
        {ready: true}
      ).then(merchantResponse => {
        console.log("Merchant responded to changePaymentMethod: ", merchantResponse);
      }).catch(err => {
        console.error("Failed to changePaymentMethod: ", err);
      });
    }
  }
});
