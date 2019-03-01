// META: script=/common/get-host-info.sub.js

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

async_test(t => {
  const frame = document.createElement("iframe"),
        support = new URL("support/closed.html", location.href).pathname,
        ident = "nestedframe";
  frame.src = `${get_host_info().HTTP_REMOTE_ORIGIN}${support}?window=parent&ident=${ident}`;
  const listener = t.step_func_done(() => {
    closedTest(frame.contentWindow, () => frame.remove());
    self.removeEventListener("message", listener);
  });
  self.addEventListener("message", listener);
  document.body.append(frame);
});

