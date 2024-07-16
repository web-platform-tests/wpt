const canvas = document.body.appendChild(document.createElement("canvas"));
const context = canvas.getContext("2d");

[
  {
    "input": "rgb(255, 0, 255)",
    "output": "#ff00ff"
  },
  {
    "input": "rgba(255, 0, 255, 1)",
    "output": "#ff00ff"
  },
  {
    "input": "#ff00ffff",
    "output": "#ff00ff"
  },
  {
    "input": "#ff00ff00",
    "output": "rgba(255, 0, 255, 0)"
  },
  {
    "input": "rgba(255, 0, 255,    0)",
    "output": "rgba(255, 0, 255, 0)"
  },
  {
    "input": "color(srgb 1 0 1)",
    "output": "#ff00ff"
  },
  {
    "input": "color(srgb 1 0 1 / 1)",
    "output": "#ff00ff"
  },
  {
    "input": "color(srgb 1 0 1 / 0)",
    "output": "rgba(255, 0, 255, 0)"
  },
  {
    "input": "color(srgb 1 none 1)",
    "output": "color(srgb 1 none 1)" // one could argue for #ff00ff here?
  },
  {
    "input": "color(srgb none -1 2 / 3)", // alpha is clamped to [0, 1] 
    "output": "color(srgb none -1 2)"
  },
  {
    "input": "color(display-p3 0.96 0.76  \t 0.79)",
    "output": "color(display-p3 0.96 0.76 0.79)"
  },
  {
    "input": "lab(29% 39 20)",
    "output": "lab(29 39 20)"
  },
  {
    "input": "transparent",
    "output": "rgba(0, 0, 0, 0)"
  }
].forEach(({ input, output }) => {
  test(t => {
    ["fillStyle", "strokeStyle", "shadowColor"].forEach(colorGetterSetter => {
      context[colorGetterSetter] = input;
      assert_equals(context[colorGetterSetter], output, colorGetterSetter);
    });
  }, `'${input}' should serialize as '${output}'`);
});
