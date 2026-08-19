const assertCurrentPosterSupported = () =>
  assert_implements(
    'currentPoster' in HTMLVideoElement.prototype,
    'HTMLVideoElement.currentPoster is not supported'
  );

const createPoster = (...children) => {
  const poster = document.createElement('poster');
  poster.append(...children);
  return poster;
};

// currentPoster is only meaningful once the poster image has been fetched, so
// tests wait for the image (or the poster attribute's request) to settle.
const settled = (img) =>
  new Promise((resolve) => {
    if (img.complete && img.currentSrc !== '') {
      resolve();
      return;
    }
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });

const settledUrl = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = url;
  });
