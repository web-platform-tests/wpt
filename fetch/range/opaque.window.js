// META: script=/common/get-host-info.sub.js
// META: script=resources/utils.js
// META: script=/common/utils.js
// META: timeout=long
// META: variant=
// META: variant=?foreign-redirect-second-request

const foreignOrigin = get_host_info().REMOTE_ORIGIN;

const onload = new Promise(r => window.addEventListener('load', r));

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
    scenario: "redirect-second-request"
  },
  "foreign-redirect-second-request": {
    origin: foreignOrigin,
    scenario: "redirect-second-request"
  }
}

const runTest = ({ origin, scenario }) => {
  promise_test(async t => {
    const wavURL = `${origin}${new URL('resources/long-wav.py', location).pathname}?chunked&source-key=${token()}&scenario=${scenario}`;
    await onload;
    const audio = appendAudio(document, wavURL);
    audio.onsuspend = audio.onemptied = audio.onstalled = e => console.log(e);
    await new Promise(resolve => {
      audio.onerror = resolve;
    });
  }, "meh");
};

runTest(scenarios[currentVariant()]);
