"use strict";
// Minimal payment handler backing the wpt-pay-1.json and wpt-pay-2.json
// payment methods, for tests that need PaymentRequest.show() to be
// supported. Chromium-based browsers install these payment apps
// just-in-time during show(). Two apps are needed because with only a
// single candidate app Chromium skips the payment sheet and invokes the
// handler directly, which makes abort() fail; with two apps the sheet
// stays open (and show() stays pending) until the test resolves the
// request. Chromium also requires each app to have its own service worker
// script URL, so wpt-pay-app-1.js and wpt-pay-app-2.js are trivial
// wrappers importing this shared implementation. The paymentrequest event
// is deliberately left unanswered as no test using these methods completes
// a payment.
self.addEventListener("canmakepayment", (event) => {
  event.respondWith(true);
});
self.addEventListener("paymentrequest", (event) => {});
