promise_test(async t => {
  const popup = window.open("/common/blank.html");
  t.add_cleanup(() => popup.close());
  await new Promise(resolve => popup.onload = resolve);

  popup.location = "about:blank";
  // The opener can't listen for the new document's load event before that document exists.
  await t.step_wait(() => popup.location.href === "about:blank");

  assert_equals(popup.isSecureContext, location.protocol === "https:");
}, "a same-origin popup navigated to about:blank");
