onfetch = e => {
  // Changing this list requires corresponding changes in ..//fragment.window.js. Note that output
  // here is intentionally not expected there in some cases.
  [
    { "input": "test", "output": "test.txt#success" },
    { "input": "test#hi", "output": "test.txt" },
    { "input": "test#bye", "output": "test.txt#hi" },
  ].forEach(val => {
    if (e.request.url.endsWith("resources/" + val.input)) {
      e.respondWith(new Promise(async resolve => {
        resolve(await fetch(val.output));
      }));
    }
  });
}
