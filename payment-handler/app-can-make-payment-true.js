// Copyright © 2017 Chromium authors and World Wide Web Consortium, (Massachusetts Institute of Technology, ERCIM, Keio University, Beihang).

// This app always responds to CanMakePaymentEvent with "true".
self.addEventListener('canmakepayment', (canMakePaymentEvent) => {
    canMakePaymentEvent.respondWith(true);
});
