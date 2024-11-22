// META: title=Promise rejection events tests
// META: global=window,worker,shadowrealm
// META: script=support/promise-rejection-event-utils.js

// https://html.spec.whatwg.org/#unhandled-promise-rejections

'use strict';

setup({
  allow_uncaught_exception: true
});

//
// Straightforward unhandledrejection tests
//
async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledSucceed(t, e, function() { return p; });

  p = Promise.reject(e);
}, 'unhandledrejection: from Promise.reject');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledSucceed(t, e, function() { return p; });

  p = new Promise(function(_, reject) {
    reject(e);
  });
}, 'unhandledrejection: from a synchronous rejection in new Promise');

async_test(function(t) {
  var e = new Error();
  var e2 = new Error();
  var promise2;

  onUnhandledSucceed(t, e2, function() { return promise2; });

  var unreached = t.unreached_func('promise should not be fulfilled');
  promise2 = Promise.reject(e).then(unreached, function(reason) {
    t.step(function() {
      assert_equals(reason, e);
    });
    throw e2;
  });
}, 'unhandledrejection: from a throw in a rejection handler chained off of Promise.reject');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledSucceed(t, e, function() { return p; });

  p = Promise.resolve().then(function() {
    return Promise.reject(e);
  });
}, 'unhandledrejection: from returning a Promise.reject-created rejection in a fulfillment handler');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledSucceed(t, e, function() { return p; });

  p = Promise.resolve().then(function() {
    throw e;
  });
}, 'unhandledrejection: from a throw in a fulfillment handler');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledSucceed(t, e, function() { return p; });

  p = Promise.all([Promise.reject(e)]);
}, 'unhandledrejection: from Promise.reject, indirected through Promise.all');

//
// Negative unhandledrejection/rejectionhandled tests with immediate attachment
//

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledFail(t, function() { return p; });

  var unreached = t.unreached_func('promise should not be fulfilled');
  p = Promise.reject(e).then(unreached, function() {});
}, 'no unhandledrejection/rejectionhandled: rejection handler attached synchronously to a promise from Promise.reject');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledFail(t, function() { return p; });

  var unreached = t.unreached_func('promise should not be fulfilled');
  p = Promise.all([Promise.reject(e)]).then(unreached, function() {});
}, 'no unhandledrejection/rejectionhandled: rejection handler attached synchronously to a promise from ' +
   'Promise.reject, indirecting through Promise.all');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledFail(t, function() { return p; });

  var unreached = t.unreached_func('promise should not be fulfilled');
  p = new Promise(function(_, reject) {
    reject(e);
  }).then(unreached, function() {});
}, 'no unhandledrejection/rejectionhandled: rejection handler attached synchronously to a synchronously-rejected ' +
   'promise created with new Promise');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledFail(t, function() { return p; });

  var unreached = t.unreached_func('promise should not be fulfilled');
  p = Promise.resolve().then(function() {
    throw e;
  }).then(unreached, function(reason) {
    t.step(function() {
      assert_equals(reason, e);
    });
  });
}, 'no unhandledrejection/rejectionhandled: rejection handler attached synchronously to a promise created from ' +
   'throwing in a fulfillment handler');

async_test(function(t) {
  var e = new Error();
  var p;

  onUnhandledFail(t, function() { return p; });

  var unreached = t.unreached_func('promise should not be fulfilled');
  p = Promise.resolve().then(function() {
    return Promise.reject(e);
  }).then(unreached, function(reason) {
    t.step(function() {
      assert_equals(reason, e);
    });
  });
}, 'no unhandledrejection/rejectionhandled: rejection handler attached synchronously to a promise created from ' +
   'returning a Promise.reject-created promise in a fulfillment handler');
