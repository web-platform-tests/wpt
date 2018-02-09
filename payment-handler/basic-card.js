self.addEventListener('paymentrequest', event => {
  event.respondWith({
    methodName: 'basic-card',
    details: {
      billingAddress: {
        addressLine: ['1875 Explorer St #1000'],
        city: 'Reston',
        country: 'US',
        dependentLocality: '',
        languageCode: '',
        organization: 'Google',
        phone: '+15555555555',
        postalCode: '20190',
        recipient: 'Jon Doe',
        region: 'VA',
        sortingCode: '',
      },
      cardNumber: '4111111111111111',
      cardSecurityCode: '123',
      cardholderName: 'Jon Doe',
      expiryMonth: '12',
      expiryYear: '2028',
    },
  });
});
