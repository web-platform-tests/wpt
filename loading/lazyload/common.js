// Helper to access the element, its associated loading promise, and also to
// resolve the promise.
class ElementLoadPromise {
  constructor(element_id) {
    this.element_id = element_id;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    });
  }
  element() {
    return document.getElementById(this.element_id);
  }
}

// Returns if the image is complete and fully loaded as a non-placeholder image.
function is_image_fully_loaded(image) {
  if (!image.complete) {
    return false;
  }

  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  let canvasContext = canvas.getContext("2d");
  canvasContext.drawImage(image, 0, 0);
  let data = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;

  // Fully loaded image should not be a placeholder which is drawn as a
  // translucent gray rectangle in placeholder_image.cc
  return data[0] != 0xd9 || data[1] != 0xd9 || data[2] != 0xd9;
}
