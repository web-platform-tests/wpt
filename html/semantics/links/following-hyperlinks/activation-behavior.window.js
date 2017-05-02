async_test(t => {
  const target = document.createElement("iframe"),
        link = document.createElement("a");
  t.add_cleanup(() => target.remove());
  target.name = "certifiedrandom";
  link.target = "certifiedrandom";
  link.href = "/";
  document.body.appendChild(target);
  target.onload = t.step_func(() => {
    if(target.contentWindow.location.href === "about:blank")
      return;
    assert_equals(target.contentWindow.location.pathname, "/");
    t.done();
  });
  link.click();
  t.step_timeout(() => assert_unreached(), 500);
}, "<a> that is not connected should still be followed");

async_test(t => {
  const target = document.createElement("iframe"),
        doc = document.implementation.createDocument("", ""),
        link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
  t.add_cleanup(() => target.remove());
  target.name = "certifiedrandom2";
  link.target = "certifiedrandom2";
  link.href = "/";
  document.body.appendChild(target);
  target.onload = t.step_func(() => {
    if(target.contentWindow.location.href === "about:blank")
      return;
    assert_unreached();
  });
  link.click();
  t.step_timeout(() => t.done(), 500);
}, "<a> that is from an inactive document should not be followed");
