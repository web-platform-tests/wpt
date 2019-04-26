self.addEventListener('canmakepayment', event => {
  event.respondWith(true);
});

self.addEventListener('paymentrequest', event => {
  const methodName = event.methodData[0].supportedMethods;
  event.respondWith(
    new Promise(resolve => {
      const result = {
        methodName,
        details: {changePaymentMethodReturned: 'Nothing'},
      };
      if (!event.changePaymentMethod) {
        result.details.changePaymentMethodReturned =
          'The changePaymentMethod() method is not implemented.';
        resolve(details);
      } else {
        event
          .changePaymentMethod(methodName, {country: 'US'})
          .then(response => {
            result.details.changePaymentMethodReturned = response;
            resolve(result);
          })
          .catch(error => {
            result.details.changePaymentMethodReturned = error.message;
            resolve(result);
          });
      }
    }),
  );
});
