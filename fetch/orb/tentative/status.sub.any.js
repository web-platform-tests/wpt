// META: script=/fetch/orb/resources/utils.js

const path = "http://{{domains[www1]}}:{{ports[http][0]}}/fetch/orb/resources";

expected_block(
  `${path}/data.json`,
  (orb_test, message) => promise_test(
    t => orb_test(t, contentType("application/json"), "status(206)"),
    message("ORB should block opaque-response-blocklisted MIME type with status 206")));

expected_block(
  `${path}/data.json`,
  (orb_test, message) =>
    promise_test(
      t => orb_test(t, contentType("application/json"), "status(302)"),
      message("ORB should block opaque response with non-ok status")));

expected_block(
  `${path}/image.png`,
  (orb_test, message) =>
    promise_test(
      t => orb_test(t, contentType("text/html"), contentTypeOptions("nosniff"), "status(302)"),
      message("ORB should block opaque redirect response without Location")),
  { skip: ["audio", "video", "script"] });
