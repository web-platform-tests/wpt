// META: script=/common/media.js

const videoURL = getVideoURI("/images/pattern"),
      videoMIMEType = getMediaContentType(videoURL);

[
  [videoURL, videoMIMEType],
  ["/images/red.png", "image/png"],
  ["/common/text-plain.txt", "text/plain"],
  ["/common/blank.html", "text/html"]
].forEach(val => {
  async_test(t => {
    const frame = document.body.appendChild(document.createElement("iframe"));
    frame.src = val[0];
    frame.onload = t.step_func_done(() => {
      assert_equals(frame.contentDocument.contentType, val[1]);
      frame.contentDocument.write("<b>Heya</b>");
      assert_equals(frame.contentDocument.body.firstChild.localName, "b");
      assert_equals(frame.contentDocument.body.firstChild.textContent, "Heya");
      assert_equals(frame.contentDocument.contentType, val[1]);

      // Make sure a load event is fired across browsers
      frame.contentDocument.close();
    });
  }, "document.write() in a " + val[1] + " document");
});
