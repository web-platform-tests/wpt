/**
 * A payment handler that opens a window and allows the user to trigger
 * different types of promise rejections for testing error propagation.
 */

let resolver = null;
let rejecter = null;
let activeMethodName = null;

self.addEventListener('canmakepayment', event => {
  event.respondWith(true);
});

self.addEventListener('message', msgEvent => {
  console.log(`[ServiceWorker] Received message from payment app: ${msgEvent.data}`);
  if (!resolver || !rejecter) {
    console.error('[ServiceWorker] Received message, but no active payment request found.');
    return;
  }

  if (msgEvent.data === 'success') {
    console.log('[ServiceWorker] Resolving payment request with success');
    resolver({
      methodName: activeMethodName,
      details: {status: 'success'},
    });
  } else if (msgEvent.data === 'reject-operation-error') {
    console.log('[ServiceWorker] Rejecting payment request with OperationError');
    rejecter(new DOMException('Reject with OperationError', 'OperationError'));
  } else if (msgEvent.data === 'reject-syntax-error') {
    console.log('[ServiceWorker] Rejecting payment request with SyntaxError');
    rejecter(new DOMException('Reject with SyntaxError', 'SyntaxError'));
  } else {
    console.log(`[ServiceWorker] Unrecognized message data: ${msgEvent.data}`);
    return; // Message not for us.
  }

  resolver = null;
  rejecter = null;
  activeMethodName = null;
});

self.addEventListener('paymentrequest', event => {
  console.log('[ServiceWorker] Received paymentrequest event');
  activeMethodName = event.methodData[0].supportedMethods;
  event.respondWith(new Promise((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;

    console.log('[ServiceWorker] Opening payment app window...');
    event.openWindow('payment-app/reject-errors.html').then(() => {
      console.log('[ServiceWorker] Payment app window opened successfully');
    }).catch(err => {
      console.error(`[ServiceWorker] Failed to open payment app window: ${err}`);
      resolver = null;
      rejecter = null;
      activeMethodName = null;
      reject(err);
    });
  }));
});
