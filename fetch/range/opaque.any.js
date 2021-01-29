// META: script=/common/get-host-info.sub.js
// META: script=resources/utils.js
// META: script=/common/utils.js
// META: timeout=long

const foreignOrigin = get_host_info().REMOTE_ORIGIN;

const onload = new Promise(r => window.addEventListener('load', r));

[
  {
    origin: "",
    scenario: "redirect-second-request"
  },
  {
    origin: foreignOrigin,
    scenario: "redirect-second-request"
  }
].forEach(({ origin, scenario }) => {
  promise_test(async t => {
    const wavURL = `${origin}${new URL('resources/long-wav.py', location).pathname}?chunked&source-key=${token()}&scenario=${scenario}`;
    await onload;
    const audio = appendAudio(document, wavURL);
    audio.onsuspend = audio.onemptied = audio.onstalled = e => console.log(e);
    await new Promise(resolve => {
      audio.onerror = resolve;
    });
  }, "meh");
});
