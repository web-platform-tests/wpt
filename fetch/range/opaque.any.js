// META: script=/common/get-host-info.sub.js
// META: script=resources/utils.js
// META: script=/common/utils.js

const foreignOrigin = get_host_info().REMOTE_ORIGIN;

const onload = new Promise(r => window.addEventListener('load', r));

promise_test(async t => {
  const wavURL = `${foreignOrigin}${new URL('resources/long-wav.py', location).pathname}?chunked&source-key=${token()}`;
  await onload;
  const audio = appendAudio(document, wavURL);
  audio.onprogress = e => console.log(audio.readyState, audio.networkState, audio.ended);
  audio.onerror = e => console.log(e);
  await new Promise(() => {});
}, "meh");
