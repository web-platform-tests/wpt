/**
 * A payment handler that opens a window and allows the user to trigger
 * different types of promise rejections for testing error propagation.
 */
self.addEventListener('canmakepayment', event => {
  event.respondWith(true);
});

self.addEventListener('paymentrequest', event => {
  const methodName = event.methodData[0].supportedMethods;
  event.respondWith(new Promise((resolve, reject) => {
    const handler = (msgEvent) => {
      if (msgEvent.data === 'success') {
        resolve({
          methodName: methodName,
          details: {status: 'success'},
        });
      } else if (msgEvent.data === 'reject-operation-error') {
        reject(new DOMException('Reject with OperationError', 'OperationError'));
      } else if (msgEvent.data === 'reject-syntax-error') {
        reject(new DOMException('Reject with SyntaxError', 'SyntaxError'));
      } else {
        return; // Message not for us.
      }
      self.removeEventListener('message', handler);
    };
    self.addEventListener('message', handler);

    event.openWindow('payment-app/reject-errors.html').catch(err => {
      self.removeEventListener('message', handler);
      reject(err);
    });
  }));
});
