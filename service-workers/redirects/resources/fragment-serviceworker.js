onfetch = e => {
  // Changing this list requires corresponding changes in ..//fragment.window.js. Note that output
  // here is intentionally not expected there in some cases.
  [
    { "input": "?1#green", "output": "#green" },
    { "input": "?2#green", "output": "#red" },
    { "input": "?3", "output": "#green" },
  ].forEach(val => {
    if (e.request.url.endsWith(`/images/colors.svg${val.input}`)) {
      e.respondWith(fetch(`/images/colors.svg${val.output}`));
    }
  });
}
