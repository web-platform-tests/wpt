function closedTest(newWindow, closeNewWindowsBrowsingContext) {
  assert_equals(newWindow.closed, false);
  closeNewWindowsBrowsingContext();
  assert_equals(newWindow.closed, true);
}

test(() => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  closedTest(frame.contentWindow, () => frame.remove());
});

test(() => {
  const openee = window.open();
  closedTest(openee, () => openee.close());
});
