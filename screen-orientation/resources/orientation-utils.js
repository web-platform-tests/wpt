/**
 *
 * @param {object} options
 * @param {string} options.src - The iframe src
 * @param {Window} options.context - The browsing context in which the iframe will be created
 * @returns
 */
export async function attachIframe(options = {}) {
  const { src, context } = {
    ...{ src: "about:blank", context: self },
    ...options,
  };
  const iframe = context.document.createElement("iframe");
  await new Promise((resolve) => {
    iframe.onload = resolve;
    iframe.src = src;
    context.document.body.appendChild(iframe);
  });
  return iframe;
}

export function getOppositeOrientation() {
  return screen.orientation.type.startsWith("portrait")
    ? "landscape"
    : "portrait";
}

export function makeCleanup(
  initialOrientation = screen.orientation?.type.split(/-/)[0]
) {
  return async () => {
    if (initialOrientation) {
      await screen.orientation.lock(initialOrientation);
    }
    screen.orientation.unlock();
    requestAnimationFrame(async () => {
      await document.exitFullscreen();
    });
  };
}
