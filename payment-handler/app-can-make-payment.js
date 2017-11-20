// Copyright © 2017 Chromium authors and World Wide Web Consortium, (Massachusetts Institute of Technology, ERCIM, Keio University, Beihang).

self.addEventListener('canmakepayment', (canMakePaymentEvent) => {
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
            canMakePaymentEvent.respondWith(Promise.reject(new Error('Custom error')));
            break;
        default:
            console.log('Unrecognized payment method name ' + methodName);
            break;
    }
});
