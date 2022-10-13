// To use this file, use the following imports:
// // META: script=/common/dispatcher/dispatcher.js
// // META: script=/common/get-host-info.sub.js
// // META: script=/common/utils.js
// // META: script=/resources/testdriver.js
// // META: script=/resources/testdriver-vendor.js
// // META: script=/resources/testharness.js
// // META: script=/resources/testharnessreport.js
// // META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// // META: script=./resources/sandbox-top-navigation-helper.js

// Helper file that provides various functions to test top-level navigation
// with various frame and sandbox flag configurations. Note: there are flakes
// associated with giving user activation to frames created using the remote
// context helper, so any testing that requires user activation will need to
// be done the old fashioned way.

async function createNestedIframe(parent, origin, frame_sandbox, header_sandbox)
{
  let headers = [];
  if (header_sandbox) {
    headers.push([
      "Content-Security-Policy",
      "sandbox allow-scripts " + header_sandbox
    ]);
  }
  let iframe_attributes = {};
  if (frame_sandbox) {
    iframe_attributes.sandbox = "allow-scripts " + frame_sandbox;
  }
  return parent.addIframe({
    origin: origin,
    headers: headers,
  }, iframe_attributes);
}

async function attemptTopNavigation(iframe, should_succeed) {
  let did_succeed;
  try {
    await iframe.executeScript(() => {
      window.top.location.href = "https://google.com";
    });
    did_succeed = true;
  } catch (e) {
    did_succeed = false;
  }

  assert_equals(did_succeed, should_succeed,
      should_succeed ?
          "The navigation should succeed." :
          "The navigation should fail.");
}

async function setupTest() {
  const rcHelper = new RemoteContextHelper();
  return rcHelper.addWindow(/*config=*/ null, /*options=*/ {});
}
