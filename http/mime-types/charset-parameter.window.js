// Use the MIME type charset parameter as a proxy for how other parameters might be parsed.
[
  ["text/html;charset=gbk", "GBK"],
  "Legacy comment syntax",
  ["text/html;charset=gbk(", "UTF-8"],
  ["text/html;x=(;charset=gbk", "GBK"],
  "Duplicate parameter",
  ["text/html;charset=gbk;charset=windows-1255", "GBK"],
  "Significant spaces",
  ["text/html;charset =gbk", "UTF-8"],
  "Insignificant spaces",
  ["text/html ;charset=gbk", "GBK"],
  ["text/html; charset=gbk", "GBK"],
  ["text/html;charset= gbk", "GBK"],
  "Single quotes (invalid)",
  ["text/html;charset='gbk'", "UTF-8"],
  ["text/html;charset='gbk", "UTF-8"],
  ["text/html;charset=gbk'", "UTF-8"],
  "Invalid parameters",
  ["text/html;test;charset=gbk", "GBK"],
  ["text/html;test=;charset=gbk", "GBK"],
  ["text/html;';charset=gbk", "GBK"],
  ["text/html;\";charset=gbk", "GBK"],
  "Double quotes",
  ["text/html;charset=\"gbk\"", "GBK"],
  ["text/html;charset=\"gbk", "GBK"], // Safari rejects this and that seems nicer
  ["text/html;charset=gbk\"", "UTF-8"],
  ["text/html;charset=\" gbk\"", "GBK"],
  ["text/html;charset=\"\\ gbk\"", "GBK"],
  ["text/html;charset=\"\\g\\b\\k\"", "GBK"],
].forEach(val => {
  if(typeof val === "string") {
    return;
  }
  const mime = val[0];
  async_test(t => {
    const frame = document.createElement("iframe"),
          expectedEncoding = val[1];
    t.add_cleanup(() => frame.remove());
    frame.onload = t.step_func(() => {
      if(frame.contentWindow.location.href === "about:blank") {
        return;
      }
      // Edge fails all these tests due to not using the correct encoding label.
      assert_equals(frame.contentDocument.characterSet, expectedEncoding);
      t.done();
    });
    frame.src = "resources/mime-charset.py?type=" + encodeURIComponent(mime);
    document.body.appendChild(frame);
  }, mime);
});
