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

function plusLighter(destination, source) {
  const premultipliedSource = multiplyAlpha(source);
  const premultipliedDestination = multiplyAlpha(destination);
  const premultipliedResult = premultipliedDestination.map((channel, i) =>
    clamp01(channel + premultipliedSource[i])
  );
  return unmultiplyAlpha(premultipliedResult);
}

const toPercent = (num) => `${num * 100}%`;
const toCSSColor = (pixel) =>
  `rgb(${toPercent(pixel[0])} ${toPercent(pixel[1])} ${toPercent(pixel[2])} / ${
    pixel[3]
  })`;
const toSolidCSSGradient = (pixel) =>
  `linear-gradient(to right, ${toCSSColor(pixel)}, ${toCSSColor(pixel)})`;

const tests = [
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

export function getHTMLMixTests({ mode = "test" } = {}) {
  return tests.map((colors) => {
    const container = document.createElement("div");

    Object.assign(container.style, {
      width: "100px",
      height: "100px",
      position: "relative",
      isolation: "isolate",
    });

    if (mode === "reference") {
      const result = colors.reduce((destination, source) =>
        plusLighter(destination, source)
      );
      container.style.backgroundColor = toCSSColor(result);
      return container;
    }

    for (const [i, color] of colors.entries()) {
      const child = document.createElement("div");

      Object.assign(child.style, {
        backgroundColor: toCSSColor(color),
        position: "absolute",
        inset: "0",
        mixBlendMode: i === 0 ? "normal" : "plus-lighter",
      });

      container.append(child);
    }

    return container;
  });
}

export function getSVGMixTests({ mode = "test" } = {}) {
  return tests.map((colors) => {
    const container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    container.setAttribute("width", "100");
    container.setAttribute("height", "100");

    if (mode === "reference") {
      const result = colors.reduce((destination, source) =>
        plusLighter(destination, source)
      );
      container.style.backgroundColor = toCSSColor(result);
      return container;
    }

    for (const [i, color] of colors.entries()) {
      const child = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );

      const attributes = [
        ["fill", toCSSColor(color)],
        ["x", "0"],
        ["y", "0"],
        ["width", "100%"],
        ["height", "100%"],
        ["mix-blend-mode", i === 0 ? "normal" : "plus-lighter"],
      ];

      for (const [name, value] of attributes) child.setAttribute(name, value);
      container.append(child);
    }

    return container;
  });
}

export function getBackgroundTests({ mode = "test" } = {}) {
  return tests.map((colors) => {
    const container = document.createElement("div");

    Object.assign(container.style, {
      width: "100px",
      height: "100px",
    });

    if (mode === "reference") {
      const result = colors.reduce((destination, source) =>
        plusLighter(destination, source)
      );
      container.style.backgroundColor = toCSSColor(result);
      return container;
    }

    const backgrounds = colors
      .slice()
      .reverse()
      .map((color) => toSolidCSSGradient(color));

    console.log(backgrounds.join(", "));

    Object.assign(container.style, {
      backgroundImage: backgrounds.join(", "),
      backgroundBlendMode: backgrounds.map((_, i) =>
        i === 0 ? "normal" : "plus-lighter"
      ),
    });

    return container;
  });
}
