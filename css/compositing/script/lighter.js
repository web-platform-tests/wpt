function multiplyAlpha(pixel) {
  return pixel.map((channel, i) => {
    // Pass the alpha channel through unchanged
    if (i === 3) return channel;
    // Otherwise, multiply by alpha
    return channel * pixel[3];
  });
}

function unmultiplyAlpha(pixel) {
  return pixel.map((channel, i) => {
    // Pass the alpha channel through unchanged
    if (i === 3) return channel;
    // Avoid divide-by-zero
    if (pixel[3] === 0) return channel;
    // Divide by alpha
    return channel / pixel[3];
  });
}

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function lighter(pixels) {
  return pixels.reduce((destination, source) => {
    const premultipliedSource = multiplyAlpha(source);
    const premultipliedDestination = multiplyAlpha(destination);
    const premultipliedResult = premultipliedDestination.map((channel, i) =>
      clamp01(channel + premultipliedSource[i])
    );
    return unmultiplyAlpha(premultipliedResult);
  });
}

const toPercent = (num) => `${num * 100}%`;
export const toCSSColor = (pixel) =>
  `rgb(${toPercent(pixel[0])} ${toPercent(pixel[1])} ${toPercent(pixel[2])} / ${
    pixel[3]
  })`;

export const tests = [
  // Each test is a list of colors to composite.
  // Each color is [r, g, b, a], unmultiplied, in the range 0-1.
  [
    [1, 0, 0, 0.5],
    [0, 0, 1, 0.5],
  ],
  [
    [1, 0, 0, 0.25],
    [0, 0, 1, 0.25],
  ],
  [
    [0.5, 0, 0, 0.5],
    [0, 0, 1, 0.5],
  ],
  // Test clamping
  [
    [1, 0, 0, 1],
    [0, 0, 1, 1],
  ],
  // Test more than two elements
  [
    [0.5, 0, 0, 0.25],
    [0.25, 0.25, 0, 0.25],
    [0.25, 0, 0.1, 0.25],
    [0, 0, 0.1, 0.25],
  ],
];
