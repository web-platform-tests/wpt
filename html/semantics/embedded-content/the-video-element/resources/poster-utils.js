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

// Resolves once the image has loaded or failed.
const settled = (img) =>
  new Promise((resolve) => {
    if (img.complete && img.currentSrc !== '') {
      resolve();
      return;
    }
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });

const uniquePosterUrl = (id) =>
  `/media/poster.png?${id}&t=${Date.now()}&r=${Math.random()}`;

const absoluteUrl = (url) => new URL(url, location.href).href;

const settleFrames = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
