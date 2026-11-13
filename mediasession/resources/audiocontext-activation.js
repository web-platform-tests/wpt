// Shared code for the manual tests that check that an audible AudioContext
// can make the media session of the page the active media session.

setup({explicit_timeout: true});

const INSTRUCTIONS = `
<ol>
  <li>Click the "Start" button. The click gives the user activation that an
    AudioContext needs to start. A quiet tone plays.</li>
  <li>Press the pause media key, or use the platform media controls to pause.</li>
</ol>
<p>The test passes if the "pause" action handler runs.</p>`;

async function bodyReady() {
  if (!document.body) {
    await new Promise(resolve => {
      document.addEventListener("DOMContentLoaded", resolve, {once: true});
    });
  }
}

// A user agent can let an AudioContext start only after user activation
// (https://webaudio.github.io/web-audio-api/#allowed-to-start). Manual tests
// cannot use test_driver.bless(), so the tester clicks a button instead.
async function waitForStartButton() {
  await bodyReady();
  document.body.insertAdjacentHTML("afterbegin", INSTRUCTIONS);
  const button = document.createElement("button");
  button.id = "start";
  button.textContent = "Start";
  document.body.append(button);
  await new Promise(resolve => {
    button.addEventListener("click", resolve, {once: true});
  });
}

async function startAudibleAudioContext(t) {
  const context = new AudioContext();
  t.add_cleanup(() => context.close());
  const oscillator = new OscillatorNode(context);
  const gain = new GainNode(context, {gain: 0.01});
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  await context.resume();
  assert_equals(context.state, "running", "The AudioContext runs");
  return context;
}

function waitForPauseAction(t) {
  t.add_cleanup(() => navigator.mediaSession.setActionHandler("pause", null));
  return new Promise(resolve => {
    navigator.mediaSession.setActionHandler("pause", resolve);
  });
}

// Runs one manual test: the page plays audio only through an AudioContext,
// with the given playbackState and audio session type, and expects the
// "pause" action from the platform media controls.
function audioContextActivationTest({playbackState = "none", audioSessionType = "auto"}) {
  const usesType = audioSessionType !== "auto";
  const label = usesType ? audioSessionType :
                playbackState !== "none" ? "playbackState" : "no signal";
  const description = usesType ?
      `a "${audioSessionType}" audio session` :
      `a playbackState of "${playbackState}"`;

  promise_test(async t => {
    if (usesType) {
      assert_implements("audioSession" in navigator,
                        "navigator.audioSession is not supported");
    }
    await waitForStartButton();
    const pauseAction = waitForPauseAction(t);
    navigator.mediaSession.metadata =
        new MediaMetadata({title: `AudioContext activation (${label})`});
    navigator.mediaSession.playbackState = playbackState;
    t.add_cleanup(() => { navigator.mediaSession.playbackState = "none"; });
    if ("audioSession" in navigator) {
      navigator.audioSession.type = audioSessionType;
      t.add_cleanup(() => { navigator.audioSession.type = "auto"; });
    }
    await startAudibleAudioContext(t);
    const details = await pauseAction;
    assert_equals(details.action, "pause");
  }, `The media session of a page with an audible AudioContext and ${description} ` +
     `receives the pause action`);
}
