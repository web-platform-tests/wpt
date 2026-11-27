// META: global=window
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
'use strict';

async function openWindowWithFeatures(t, features, targetWindow = window) {
  await test_driver.bless('window.open', null, targetWindow);
  const popup = targetWindow.open('/resources/blank.html', '', features);
  assert_not_equals(popup, null,
                    `window.open with '${features}' should succeed`);
  t.add_cleanup(() => {
    popup.close();
  });
  return popup;
}

function waitForLoad(w) {
  return new Promise(resolve => {
    if (w.location.href.endsWith('/resources/blank.html') &&
        w.document.readyState === 'complete') {
      resolve();
      return;
    }
    w.addEventListener('load', resolve, {once: true});
  });
}

test(() => {
  assert_true('alwaysOnTopPopup' in window,
              'window.alwaysOnTopPopup should be exposed');
  assert_equals(typeof window.alwaysOnTopPopup, 'boolean',
                'window.alwaysOnTopPopup should be a boolean');
  assert_false(
      window.alwaysOnTopPopup,
      'window.alwaysOnTopPopup should default to false on the main window');
  assert_throws_js(TypeError, () => {
    window.alwaysOnTopPopup = true;
  }, 'window.alwaysOnTopPopup should be readonly');
}, 'window.alwaysOnTopPopup is exposed and defaults to false');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const popup = await openWindowWithFeatures(t, 'popup');
  assert_false(popup.alwaysOnTopPopup,
               'popup.alwaysOnTopPopup should be false synchronously');
  await waitForLoad(popup);
  assert_false(popup.alwaysOnTopPopup,
               'popup.alwaysOnTopPopup should remain false after load');
}, 'Popup opened without alwaysOnTop has alwaysOnTopPopup === false');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'denied');
  const popup = await openWindowWithFeatures(t, 'popup,alwaysOnTop=true');
  assert_false(
      popup.alwaysOnTopPopup,
      'popup.alwaysOnTopPopup should be false synchronously without permission');
  await waitForLoad(popup);
  assert_false(
      popup.alwaysOnTopPopup,
      'popup.alwaysOnTopPopup should be false after load without permission');
}, 'window.open with alwaysOnTop=true without window-management permission falls back to normal popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const popup = await openWindowWithFeatures(t, 'popup,alwaysOnTop=true');
  assert_true(popup.alwaysOnTopPopup,
              'popup.alwaysOnTopPopup should be true synchronously');
  await waitForLoad(popup);
  assert_true(
      popup.alwaysOnTopPopup,
      'popup.alwaysOnTopPopup should be true in the loaded popup document');
}, 'window.open with popup,alwaysOnTop=true and window-management permission opens an always-on-top popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const truthyFeatures = [
    'popup,alwaysOnTop',
    'popup,alwaysOnTop=1',
    'popup,alwaysOnTop=yes',
    'popup,alwaysOnTop=true',
    'popup,AlWaYsOnToP=TrUe',
    'alwaysOnTop=true',
    'alwaysOnTop=true,resizable=no',
  ];
  for (const features of truthyFeatures) {
    const popup = await openWindowWithFeatures(t, features);
    assert_true(popup.alwaysOnTopPopup,
                `popup.alwaysOnTopPopup should be true synchronously for '${
                    features}'`);
    await waitForLoad(popup);
    assert_true(
        popup.alwaysOnTopPopup,
        `popup.alwaysOnTopPopup should be true after load for '${features}'`);
    popup.close();
  }
}, 'Truthy alwaysOnTop feature string variations open an always-on-top popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const falsyFeatures = [
    'popup,alwaysOnTop=0',
    'popup,alwaysOnTop=false',
    'popup,alwaysOnTop=no',
  ];
  for (const features of falsyFeatures) {
    const popup = await openWindowWithFeatures(t, features);
    assert_false(popup.alwaysOnTopPopup,
                 `popup.alwaysOnTopPopup should be false synchronously for '${
                     features}'`);
    await waitForLoad(popup);
    assert_false(
        popup.alwaysOnTopPopup,
        `popup.alwaysOnTopPopup should be false after load for '${features}'`);
    popup.close();
  }
}, 'Falsy alwaysOnTop feature string variations open a normal popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const nonPopupFeatures = [
    'popup=0,alwaysOnTop=true',
    'popup=false,alwaysOnTop=true',
    'popup=no,alwaysOnTop=true',
  ];
  for (const features of nonPopupFeatures) {
    const win = await openWindowWithFeatures(t, features);
    assert_false(
        win.alwaysOnTopPopup,
        `win.alwaysOnTopPopup should be false synchronously for '${features}'`);
    await waitForLoad(win);
    assert_false(
        win.alwaysOnTopPopup,
        `win.alwaysOnTopPopup should be false after load for '${features}'`);
    win.close();
  }
}, 'Non-popup window.open with alwaysOnTop=true does not create an always-on-top popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const iframe = document.createElement('iframe');
  iframe.allow = 'window-management \'none\'';
  iframe.src = '/resources/blank.html';
  document.body.appendChild(iframe);
  t.add_cleanup(() => {
    iframe.remove();
  });
  await new Promise(resolve =>
                        iframe.addEventListener('load', resolve, {once: true}));

  const popup = await openWindowWithFeatures(t, 'popup,alwaysOnTop=true',
                                             iframe.contentWindow);
  assert_false(
      popup.alwaysOnTopPopup,
      'popup.alwaysOnTopPopup should be false when window-management permissions policy is disallowed');
  await waitForLoad(popup);
  assert_false(popup.alwaysOnTopPopup,
               'popup.alwaysOnTopPopup should remain false after load');
}, 'Iframe disallowed by window-management permissions policy cannot open an always-on-top popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const popup = await openWindowWithFeatures(
      t, 'popup,alwaysOnTop=true,width=300,height=200');
  await waitForLoad(popup);
  assert_true(popup.alwaysOnTopPopup);

  const initialX = popup.screenX;
  const initialY = popup.screenY;
  const targetX = initialX > 50 ? 20 : 60;
  const targetY = initialY > 50 ? 20 : 60;

  popup.moveTo(targetX, targetY);
  popup.moveBy(20, 20);
  assert_equals(popup.screenX, initialX,
                'screenX should not change without user activation');
  assert_equals(popup.screenY, initialY,
                'screenY should not change without user activation');

  await test_driver.bless('move window', null, popup);
  popup.moveTo(targetX, targetY);
  popup.moveBy(20, 20);
  assert_equals(popup.screenX, initialX,
                'screenX should not change even with user activation');
  assert_equals(popup.screenY, initialY,
                'screenY should not change even with user activation');
}, 'moveTo and moveBy are disabled for an always-on-top popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const popup = await openWindowWithFeatures(
      t, 'popup,alwaysOnTop=true,width=300,height=200');
  await waitForLoad(popup);
  assert_true(popup.alwaysOnTopPopup);

  const initialInnerWidth = popup.innerWidth;

  assert_throws_dom('NotAllowedError', popup.DOMException, () => {
    popup.resizeTo(popup.outerWidth + 50, popup.outerHeight);
  }, 'resizeTo should throw NotAllowedError without user activation');

  await test_driver.bless('resize window', null, popup);
  const resized = new Promise(
      resolve => popup.addEventListener('resize', resolve, {once: true}));
  popup.resizeTo(popup.outerWidth + 50, popup.outerHeight);
  await resized;
  assert_equals(popup.innerWidth, initialInnerWidth + 50,
                'popup should be resized after resizeTo with user activation');

  assert_throws_dom('NotAllowedError', popup.DOMException, () => {
    popup.resizeTo(popup.outerWidth + 50, popup.outerHeight);
  }, 'resizeTo should consume transient user activation');
}, 'resizeTo requires and consumes transient user activation on an always-on-top popup');

promise_test(async t => {
  await test_driver.set_permission({name: 'window-management'}, 'granted');
  const popup = await openWindowWithFeatures(
      t, 'popup,alwaysOnTop=true,width=300,height=200');
  await waitForLoad(popup);
  assert_true(popup.alwaysOnTopPopup);

  const initialInnerWidth = popup.innerWidth;

  assert_throws_dom('NotAllowedError', popup.DOMException, () => {
    popup.resizeBy(50, 0);
  }, 'resizeBy should throw NotAllowedError without user activation');

  await test_driver.bless('resize window', null, popup);
  const resized = new Promise(
      resolve => popup.addEventListener('resize', resolve, {once: true}));
  popup.resizeBy(50, 0);
  await resized;
  assert_equals(popup.innerWidth, initialInnerWidth + 50,
                'popup should be resized after resizeBy with user activation');

  assert_throws_dom('NotAllowedError', popup.DOMException, () => {
    popup.resizeBy(50, 0);
  }, 'resizeBy should consume transient user activation');
}, 'resizeBy requires and consumes transient user activation on an always-on-top popup');
