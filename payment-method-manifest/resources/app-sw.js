self.addEventListener('canmakepayment', e => {
  e.respondWith(true);
});

self.addEventListener('paymentrequest', e => {
  e.respondWith({
    methodName: e.methodData[0].supportedMethods,
    details: { status: 'success' },
  });
});
