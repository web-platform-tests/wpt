// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: title=The "__Host-" prefix requires an explicit Path attribute of "/"
// META: timeout=long

'use strict';

// A "__Host-" prefixed cookie has to have been set with a Path attribute whose
// value is "/". That is not the same as ending up with a path of "/": a cookie
// set without a Path attribute from a URL whose path has a single segment gets a
// default path of "/" as well, and has to be rejected all the same.
//
// Reaching that case needs a document whose URL has a single path segment, so
// that its default cookie path is "/". "/" itself is the only such URL that
// wptserve does not redirect, and a document there is same-origin, so cookies can
// be set and read through it. HTTP is not covered for want of a handler at that
// depth.
//
// https://httpwg.org/http-extensions/draft-ietf-httpbis-layered-cookies.html#sane-set-cookie

// A document whose default cookie path is "/".
function loadRootDocument() {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.style = 'display: none';
    iframe.addEventListener('load', () => resolve(iframe), {once: true});
    iframe.src = '/';
    document.body.appendChild(iframe);
  });
}

function hasCookie(cookieString, name) {
  return cookieString.split('; ').some(pair => pair.split('=')[0] === name);
}

function rootDocumentTest({name, cookieName, attributes, stored}) {
  promise_test(async t => {
    await test_driver.delete_all_cookies();
    t.add_cleanup(test_driver.delete_all_cookies);

    const iframe = await loadRootDocument();
    t.add_cleanup(() => iframe.remove());
    const doc = iframe.contentWindow.document;
    assert_equals(iframe.contentWindow.location.pathname, '/',
                  'The document has a single path segment');

    doc.cookie = `${cookieName}=1; ${attributes}`;
    assert_equals(hasCookie(doc.cookie, cookieName), stored);
  }, name);
}

// Establishes the premise: a cookie set from this document without a Path
// attribute has a default path of "/", so it reaches a path outside this test's
// own directory.
promise_test(async t => {
  await test_driver.delete_all_cookies();
  t.add_cleanup(test_driver.delete_all_cookies);

  const root = await loadRootDocument();
  t.add_cleanup(() => root.remove());
  root.contentWindow.document.cookie = 'defaultpath=1';

  const elsewhere = await new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.style = 'display: none';
    iframe.addEventListener('load', () => resolve(iframe), {once: true});
    iframe.src = '/common/blank.html';
    document.body.appendChild(iframe);
  });
  t.add_cleanup(() => elsewhere.remove());

  assert_true(hasCookie(elsewhere.contentWindow.document.cookie, 'defaultpath'),
              'The cookie reaches /common/blank.html, so its path is "/"');
}, 'CONTROL a cookie set without a Path attribute here has a path of "/"');

// Control: the prefix is honoured when the Path attribute is there.
rootDocumentTest({
  name: 'CONTROL "__Host-" with an explicit Path of "/" is set',
  cookieName: '__Host-withpath',
  attributes: 'Secure; Path=/',
  stored: true,
});

// Control: prefix enforcement is active at all, so a rejection below cannot be
// mistaken for a user agent that ignores the prefix.
rootDocumentTest({
  name: 'CONTROL "__Host-" with a Path other than "/" is not set',
  cookieName: '__Host-otherpath',
  attributes: 'Secure; Path=/cookies',
  stored: false,
});

// The cases under test. Each of these ends up with a path of "/" through the
// default path, without a Path attribute that says so.
rootDocumentTest({
  name: '"__Host-" without a Path attribute is not set',
  cookieName: '__Host-nopath',
  attributes: 'Secure',
  stored: false,
});

rootDocumentTest({
  name: '"__Host-" with an empty Path attribute is not set',
  cookieName: '__Host-emptypath',
  attributes: 'Secure; Path=',
  stored: false,
});

rootDocumentTest({
  name: '"__Host-" with a valueless Path attribute is not set',
  cookieName: '__Host-barepath',
  attributes: 'Secure; Path',
  stored: false,
});
