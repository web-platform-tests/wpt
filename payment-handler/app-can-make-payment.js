self.addEventListener('canmakepayment', canMakePaymentEvent => {
  if (canMakePaymentEvent.methodData.length !== 1) {
    const msg = 'Worker says: expected exactly one method data';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  const methodData = canMakePaymentEvent.methodData[0];
  if (methodData.supportedMethods.length !== 1) {
    const msg = 'Worker says: expected exactly one supported method name';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if (methodData.data.defaultParameter !== 'defaultValue') {
    const msg = `Worker says: unexpected value for 'defaultParameter': ${
      methodData.data.defaultParameter
    }`;
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if ('defaultUnsupportedParameter' in methodData.data) {
    const msg = 'Worker says: unexpected "defaultUnsupportedParameter"';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if ('total' in canMakePaymentEvent) {
    const msg = 'Worker says: unexpected "total"';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if ('displayItems' in canMakePaymentEvent) {
    const msg = 'Worker says: unexpected "displayItems"';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if (canMakePaymentEvent.modifiers.length !== 1) {
    const msg = 'Worker says: expected exactly one modifier';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  const modifier = canMakePaymentEvent.modifiers[0];
  if (modifier.supportedMethods.length !== 1) {
    const msg =
      'Worker says: expected exactly one supported method name in modifier';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  const methodName = methodData.supportedMethods[0];
  if (methodName === 'basic-card') {
    const msg =
      'Worker says: "basic-card" payment method should never be checked in CanMakePaymentEvent';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if (modifier.supportedMethods[0] !== methodName) {
    const msg = `Worker says: unexpected modifier method name ${
      modifier.supportedMethods[0]
    }`;
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if (modifier.data.modifiedParameter !== 'modifiedValue') {
    const msg = `Worker says: unexpected value for 'modifiedParameter': ${
      modifier.data.modifiedParameter
    }`;
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if ('modifiedUnsupportedParameter' in modifier) {
    const msg =
      'Worker says: unexpected "modifiedUnsupportedParameter" in modifier';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if ('total' in modifier) {
    const msg = 'Worker says: unexpected "total" in modifier';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if ('additionalDisplayItems' in modifier) {
    const msg = 'Worker says: unexpected "additionalDisplayItems" in modifier';
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  const methodNameParts = methodName.split('/');
  const origin = methodNameParts.slice(0, 3).join('/');
  if (canMakePaymentEvent.topLevelOrigin !== origin) {
    const msg = `Worker says: unexpected top level origin ${
      canMakePaymentEvent.topLevelOrigin
    }`;
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  if (canMakePaymentEvent.paymentRequestOrigin !== origin) {
    const msg = `Worker says: unexpected iframe origin ${
      canMakePaymentEvent.paymentRequestOrigin
    }`;
    canMakePaymentEvent.respondWith(Promise.reject(new Error(msg)));
    return;
  }

  const behavior = methodNameParts[3];
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
