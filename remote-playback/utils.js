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
