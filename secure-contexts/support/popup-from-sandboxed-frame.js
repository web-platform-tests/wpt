const frame_url = https_dir + "support/open-popup-from-opaque-origin.html";
const frame_source = `<script>
const popup = window.open();
parent.postMessage(popup.isSecureContext, "*");
popup.close();
<\/script>`;

function popup_test(source, expected, name) {
  promise_test(async t => {
    const iframe = document.createElement("iframe");
    // Without allow-popups-to-escape-sandbox, the frame can't access its popup.
    iframe.sandbox = "allow-scripts allow-popups allow-popups-to-escape-sandbox";
    source(iframe);
    const message = new Promise(resolve => addEventListener("message", e => {
      if (e.source === iframe.contentWindow)
        resolve(e.data);
    }));
    document.body.append(iframe);
    t.add_cleanup(() => iframe.remove());

    assert_equals(await message, expected);
  }, name);
}

popup_test(iframe => iframe.src = frame_url, true, "an https: frame");
popup_test(iframe => iframe.srcdoc = frame_source, location.protocol === "https:", "a srcdoc frame");
popup_test(iframe => iframe.src = "data:text/html," + encodeURIComponent(frame_source), false, "a data: frame");
