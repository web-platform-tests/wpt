// META: script=/resources/testharness.js
// META: script=/resources/testharnessreport.js
// META: script=/common/utils.js
// META: script=./resources/pending_beacon-helper.js

'use strict';

/*
parallelPromiseTest(async t => {
  const uuid = token();
  const url = generateSetBeaconURL(uuid);
  const numPerMethod = 20;
  const total = numPerMethod * 2;

  // Loads an iframe that creates `numPerMethod` GET & POST beacons.
  const iframe = await loadScriptAsIframe(`
    const url = "${url}";
    for (let i = 0; i < ${numPerMethod}; i++) {
      let get = new PendingGetBeacon(url);
      let post = new PendingPostBeacon(url);
    }
  `);

  // Delete the iframe to trigger beacon sending.
  document.body.removeChild(iframe);

  // The iframe should have sent all beacons.
  await expectBeacon(uuid, {count: total});
}, 'A discarded document sends all its beacons with default config.');

parallelPromiseTest(async t => {
  const uuid = token();
  const url = generateSetBeaconURL(uuid);

  // Loads an iframe that creates a GET beacon,
  // then sends it out with `sendNow()`.
  const iframe = await loadScriptAsIframe(`
    const url = "${url}";
    let beacon = new PendingGetBeacon(url);
    beacon.sendNow();
  `);

  // Delete the document and verify no more beacons are sent.
  document.body.removeChild(iframe);

  // The iframe should have sent only 1 beacon.
  await expectBeacon(uuid, {count: 1});
}, 'A discarded document does not send an already sent beacon.');

parallelPromiseTest(async t => {
  const uuid = token();
  const url = generateSetBeaconURL(uuid);
  const numPerMethod = 20;
  const total = numPerMethod * 2;

  // Loads an iframe that creates `numPerMethod` GET & POST beacons with
  // different timeouts.
  const iframe = await loadScriptAsIframe(`
    const url = "${url}";
    for (let i = 0; i < ${numPerMethod}; i++) {
      let get = new PendingGetBeacon(url, {timeout: 100*i});
      let post = new PendingPostBeacon(url, {timeout: 100*i});
    }
  `);

  // Delete the iframe to trigger beacon sending.
  document.body.removeChild(iframe);

  // Even beacons are configured with different timeouts,
  // the iframe should have sent all beacons when it is discarded.
  await expectBeacon(uuid, {count: total});
}, `A discarded document sends all its beacons of which timeouts are not
    default.`);

parallelPromiseTest(async t => {
  const uuid = token();
  const url = generateSetBeaconURL(uuid);
  const numPerMethod = 20;
  const total = numPerMethod * 2;

  // Loads an iframe that creates `numPerMethod` GET & POST beacons with
  // different backgroundTimeouts.
  const iframe = await loadScriptAsIframe(`
    const url = "${url}";
    for (let i = 0; i < ${numPerMethod}; i++) {
      let get = new PendingGetBeacon(url, {backgroundTimeout: 100*i});
      let post = new PendingPostBeacon(url, {backgroundTimeout: 100*i});
    }
  `);

  // Delete the iframe to trigger beacon sending.
  document.body.removeChild(iframe);

  // Even beacons are configured with different backgroundTimeouts,
  // the iframe should have sent all beacons when it is discarded.
  await expectBeacon(uuid, {count: total});
}, `A discarded document sends all its beacons of which backgroundTimeouts are
    not default.`);
*/

parallelPromiseTest(async t => {
  const uuid = token();
  const url = generateSetBeaconURL(uuid);
  const numPerMethod = 1;
  const total = numPerMethod * 1;

  // Open a popup that creates `numPerMethod` GET & POST beacons.
  // Initially, the response is a 204 and the navigation is canceled. As a
  // result, the popup will be left with the initial empty document and NO
  // pending navigation.
  const popup = window.open('/common/blank.html?pipe=status(204)', '_blank');
  await new Promise(res => t.step_timeout(res, 1000));

  let scriptLoaded =
      new Promise(res => window.addEventListener('message', e => {
        if (e.data == 'script loaded')
          res();
      }));
  let allQueued = new Promise(res => window.addEventListener('message', e => {
    if (e.data == 'all queued')
      res();
  }));
  const script = `
    window.addEventListener('pagehide', (e) => {
      const url = "${url}";
      for (let i = 0; i < ${numPerMethod}; i++) {
        let get = new PendingGetBeacon(url);
      }
      window.opener.postMessage('all queued', "*");
    });
    window.opener.postMessage('script loaded', "*");
  `;
  popup.document.write(`<script>${script}</script>`);
  await scriptLoaded;
  // Close the popup to trigger beacon sending.
  popup.close();
  await allQueued;

  // The popup should have sent all beacons.
  await expectBeacon(uuid, {count: total});
}, 'A closed popup window send all its beacons with default config.');
