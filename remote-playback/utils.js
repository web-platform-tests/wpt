// Helpers for the Remote Playback API manual tests.

// A user agent may not be able to determine whether remote playback is
// feasible for a media element until its metadata (e.g., duration and codecs)
// has loaded. For example, a user agent may not offer remote playback for media
// of unknown or very short duration, in which case prompt() could reject
// without showing any UI.
//
// Disables the given buttons (which are expected to call prompt()) until
// |video| has loaded metadata, then enables them. Returns a Promise that
// resolves once metadata has loaded, or rejects if the media fails to load.
function enablePromptAfterMetadataLoaded(video, ...buttons) {
  const metadataLoaded =
      video.readyState >= HTMLMediaElement.HAVE_METADATA ?
      Promise.resolve() :
      new Promise((resolve, reject) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
        video.addEventListener("error", () => {
          reject(new Error("Failed to load media: " + video.currentSrc));
        }, { once: true });
      });
  buttons.forEach(button => button.disabled = true);
  return metadataLoaded.then(() => {
    buttons.forEach(button => button.disabled = false);
  });
}

// Calls |remote|.prompt() the next time |button| is clicked, and returns a
// Promise that settles with the result of prompt().
//
// prompt() requires transient activation, so it is called synchronously from
// the click handler. Calling it from a later task (for example, a
// watchAvailability() callback) is not triggered by the user gesture, and the
// activation may have expired by the time the task runs, which causes prompt()
// to reject with InvalidAccessError.
function promptOnClick(button, remote) {
  return new Promise((resolve, reject) => {
    button.addEventListener("click", () => {
      remote.prompt().then(resolve, reject);
    }, { once: true });
  });
}

// Returns a Promise that resolves the next time an event named |type| is fired
// at |target|.
function waitForEvent(target, type) {
  return new Promise(resolve => {
    target.addEventListener(type, resolve, { once: true });
  });
}

// Appends "<type>:<state>" to |log| whenever a connecting, connect or
// disconnect event is fired at |remote|, where <state> is the value of
// |remote|.state when the event is dispatched. If |useEventHandlerAttributes|
// is true, the onconnecting, onconnect and ondisconnect attributes are used
// instead of addEventListener().
function logRemotePlaybackEvents(remote, log,
                                 useEventHandlerAttributes = false) {
  for (const type of ["connecting", "connect", "disconnect"]) {
    const listener = () => log.push(`${type}:${remote.state}`);
    if (useEventHandlerAttributes) {
      remote["on" + type] = listener;
    } else {
      remote.addEventListener(type, listener);
    }
  }
}
