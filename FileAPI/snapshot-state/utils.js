/**
 * @param {Element} element
 * @param {string} eventName
 */
function eventFired(element, eventName) {
  return new Promise((resolve) => {
    element.addEventListener(eventName, resolve, { once: true });
  });
}

/**
 * @param {File} file
 * @param {keyof<FileReader>} method
 */
export function promisifiedFileReader(file, method) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => resolve(reader.result);
    reader[method](file);
  });
}

export let initialState;
export const ready = (async () => {
  await eventFired(fileInput, "change");
  const file = fileInput.files[0];
  initialState = {
    size: file.size,
    lastModified: file.lastModified,
  };
  await eventFired(readyButton, "click");
})();

export function testFileAttributes(title) {
  promise_test(async (t) => {
    await ready;
    assert_equals(initialState.size, fileInput.files[0].size, "File#size");
    assert_equals(
      initialState.lastModified,
      fileInput.files[0].lastModified,
      "File#lastModified"
    );
  }, title);
}
