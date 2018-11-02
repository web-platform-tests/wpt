var callback = arguments[arguments.length - 1];

window.addEventListener("message", function handle(event) {
  if (!event.data || event.data.type !== "testdriver-next message") {
    return;
  }

  window.removeEventListener("message", handle);

  callback(event.data.message);
});

/**
 * The current window and its opener belong to the same domain, making it
 * technically possible for data structures to be shared directly. Some
 * browser/WebDriver implementations [1] do not correctly serialize Arrays from
 * a foreign realm. Transmitting data structures via the `postMessage` API
 * avoids this issue because doing so involves de-serializing values in the
 * local realm.
 *
 * [1] This has been observed in Edge version 17 and/or the corresponding
 *     release of Edgedriver
 */
window.opener.postMessage({ type: "testdriver-resume" }, "*");
