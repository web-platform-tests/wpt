// Draws lime to an OffscreenCanvas object and returns "message", or a description of what went
// wrong.
function drawToCanvas(canvas) {
  try {
    const context = canvas.getContext("2d");
    context.fillStyle = "lime";
    context.fillRect(0, 0, canvas.width, canvas.height);
  } catch (e) {
    return `drawing threw ${e.name}`;
  }
  // Request a rendering update, which pushes the bitmap to a placeholder canvas element. This throws
  // where requestAnimationFrame() is not available or not supported.
  try {
    requestAnimationFrame(() => {});
  } catch {}
  return "message";
}
