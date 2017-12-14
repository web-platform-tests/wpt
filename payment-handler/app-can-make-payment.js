self.addEventListener('canmakepayment', canMakePaymentEvent => {
  const methodName = canMakePaymentEvent.methodData[0].supportedMethods[0];
  const behavior = methodName.split('/')[3];
  switch (behavior) {
    case 'canMakePayment-true':
      canMakePaymentEvent.respondWith(true);
      break;
    case 'canMakePayment-false':
      canMakePaymentEvent.respondWith(false);
      break;
    case 'canMakePayment-promise-true':
      canMakePaymentEvent.respondWith(Promise.resolve(true));
      break;
    case 'canMakePayment-promise-false':
      canMakePaymentEvent.respondWith(Promise.resolve(false));
      break;
    case 'canMakePayment-custom-error':
      canMakePaymentEvent.respondWith(
        Promise.reject(new Error('Custom error')),
      );
      break;
    default:
      const msg = `Worker says: unrecognized payment method name ${methodName}`;
      canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
      break;
  }
});
