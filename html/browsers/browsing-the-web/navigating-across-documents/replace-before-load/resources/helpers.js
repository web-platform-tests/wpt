window.waitForLoad = (t, iframe, urlRelativeToThisDocument) => {
  return new Promise(resolve => {
    iframe.addEventListener("load", t.step_func(() => {
      assert_equals(iframe.contentWindow.location.href, (new URL(urlRelativeToThisDocument, location.href)).href);

      // Wait a bit longer to ensure all history stuff has settled, e.g. the document is "completely loaded"
      // (which happens from a queued task).
      setTimeout(resolve, 0);
    }), { once: true });
  });
};

window.setupSentinelIframe = async (t) => {
  // If this iframe gets navigated by history.back(), then the iframe under test did not, so we did a replace.
  const sentinelIframe = document.createElement("iframe");
  sentinelIframe.src = "/common/blank.html?sentinelstart";
  document.body.append(sentinelIframe);
  t.add_cleanup(() => sentinelIframe.remove());

  await waitForLoad(t, sentinelIframe, "/common/blank.html?sentinelstart");

  sentinelIframe.src = "/common/blank.html?sentinelend";
  await waitForLoad(t, sentinelIframe, "/common/blank.html?sentinelend");

  return sentinelIframe;
};

window.checkSentinelIframe = async (t, sentinelIframe) => {
  // Go back. Since iframe should have done a replace, this should move sentinelIframe back, not iframe.
  history.back();
  await waitForLoad(t, sentinelIframe, "/common/blank.html?sentinelstart");
};

window.insertIframe = (t, url) => {
  const iframe = document.createElement("iframe");
  iframe.src = url;
  document.body.append(iframe);
  t.add_cleanup(() => iframe.remove());
  return iframe;
};
