const assertPosterLazyLoadSupported = () => {
  assert_implements(
    'currentPoster' in HTMLVideoElement.prototype,
    'HTMLVideoElement.currentPoster is not supported'
  );
  assert_implements(
    'loading' in HTMLVideoElement.prototype,
    'HTMLVideoElement.loading is not supported'
  );
};

const observePosterFetches = (t, url) => {
  const entries = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === url) entries.push(entry);
    }
  });
  observer.observe({ entryTypes: ['resource'] });
  t.add_cleanup(() => observer.disconnect());
  return entries;
};

const createPosterVideo = (t, { videoLoading, imgLoading, offscreen = false, id }) => {
  const video = document.createElement('video');
  video.src = '/media/A4.webm';
  if (videoLoading) video.loading = videoLoading;
  if (offscreen) video.style.marginTop = '1000vh';

  const img = document.createElement('img');
  if (imgLoading) img.loading = imgLoading;
  img.src = `/media/poster.png?${id}&t=${Date.now()}&r=${Math.random()}`;

  const poster = document.createElement('poster');
  poster.appendChild(img);
  video.appendChild(poster);

  const entries = observePosterFetches(t, new URL(img.src, location.href).href);
  t.add_cleanup(() => video.remove());
  return { video, img, entries };
};

// Resolves once an eager, in-viewport poster has been fetched, so that a
// lazy poster still having no fetch afterwards means it was deferred.
const waitForEagerPosterFetch = async (t) => {
  const { video, entries } = createPosterVideo(t, {
    videoLoading: 'eager',
    imgLoading: 'eager',
    id: 'control',
  });
  document.body.appendChild(video);
  await t.step_wait(() => entries.length > 0, 'Wait for the control poster fetch');
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
};
