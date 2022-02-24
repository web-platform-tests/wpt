// META: script=/common/get-host-info.sub.js
// META: script=resources/utils.js
// META: script=/common/utils.js
// META: timeout=long
// META: variant=
// META: variant=?foreign-redirect-second-request

const foreignOrigin = get_host_info().REMOTE_ORIGIN;

const documentReady = new Promise(resolve => window.addEventListener("load", resolve));

const defaultVariant = "same-redirect-second-request";
const currentVariant = () => {
  const query = self.location.search;
  if (!query) {
    return defaultVariant;
  }
  return query.substring(1);
};

const scenarios = {
  "same-redirect-second-request": {
    origin: "",
    scenario: "redirect-second-request",
    title: "A same-origin media element fetch whereby the second range request is redirected"
  },
  "foreign-redirect-second-request": {
    origin: foreignOrigin,
    scenario: "redirect-second-request",
    title: "A cross-origin media element fetch whereby the second range request is redirected"
  }
}

const runTest = ({ origin, scenario, title }) => {
  promise_test(async t => {
    // Fetch a WAV file in chunks of maximum 2048 bytes. Provide a source-key for logging and a
    // scenario for it to perform specific functions, such as returning a redirect response.
    const key = token();
    const wavURL = `${origin}${new URL("resources/long-wav.py", location).pathname}?chunked&source-key=${key}&scenario=${scenario}`;
    // Do not start before the document hsa finished loading.
    await documentReady;
    const audio = appendAudio(document, wavURL);
    // Log a bunch of events for debugging.
    audio.loadstart = audio.onprogress = audio.onsuspend = audio.onabort = audio.onemptied = audio.onstalled = audio.onloadedmetadata = audio.onloadeddata = audio.oncanplay = audio.oncanplaythrough = audio.onplaying = audio.onwaiting = audio.onseeking = audio.onseeked = audio.onended = audio.ondurationchange = audio.ontimeupdate = audio.onplay = audio.onpause = audio.onratechange = audio.onresize = audio.onvolumechange = e => console.log(e);

    // Log the WAV fetches that have been made
    let request_urls = [];
    await t.step_wait(async () => {
      const response = await (await fetch(`resources/stash-take.py?key=${key}&peek`)).json();
      if (response) {
        request_urls = response.request_urls;
      }
      return response && response.request_urls.length >= 3
    }, "Getting logging data", undefined, 250);

    assert_array_equals(request_urls, ["pass condition unclear"]);
  }, title);
};

runTest(scenarios[currentVariant()]);
