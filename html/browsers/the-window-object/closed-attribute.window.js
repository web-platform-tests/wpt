// META: script=/common/get-host-info.sub.js

function closedTest(newWindow, closeNewWindowsBrowsingContext) {
  assert_equals(newWindow.closed, false);
  closeNewWindowsBrowsingContext();
  assert_equals(newWindow.closed, true);
}

test(() => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  closedTest(frame.contentWindow, () => frame.remove());
}, "closed and same-origin nested browsing context");

test(() => {
  const openee = window.open();
  closedTest(openee, () => openee.close());

  // This should not matter
  openee.close();
  assert_equals(openee.closed, true);
}, "closed/close() and same-origin auxiliary browsing context");

const support = new URL("support/closed.html", location.href).pathname;
[
  {
    type: "cross-origin",
    url: `${get_host_info().HTTP_REMOTE_ORIGIN}${support}`
  },
  {
    type: "cross-site",
    url: `${get_host_info().HTTP_NOTSAMESITE_ORIGIN}${support}`
  }
].forEach(val => {
  async_test(t => {
    const frame = document.createElement("iframe"),
          ident = `${val.type}-nestedframe`;
    frame.src = `${val.url}?window=parent&ident=${ident}`;
    const listener = t.step_func(e => {
      if (e.data === ident) {
        closedTest(frame.contentWindow, () => frame.remove());
        self.removeEventListener("message", listener);
        t.done();
      }
    });
    self.addEventListener("message", listener);
    document.body.append(frame);
  }, `closed and ${val.type} nested browsing context`);

  async_test(t => {
    const ident = `${val.type}-auxiliaryframe`,
          support = new URL("support/closed.html", location.href).pathname,
          openee = window.open(`${val.url}?window=opener&ident=${ident}`),
          listener = t.step_func(e => {
      if (e.data === ident) {
        closedTest(openee, () => openee.close());

        // This should not matter
        openee.close();
        assert_equals(openee.closed, true);

        self.removeEventListener("message", listener);
        t.done();
      }
    });
    self.addEventListener("message", listener);
  }, `closed/close() and ${val.type} auxiliary browsing context`);
});
