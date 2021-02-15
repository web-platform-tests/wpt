onfetch = e => {
  // Changing this list requires corresponding changes in ..//fragment.window.js
  [
    { input: "?1#green", output: "#green" },
    { input: "?2#green", output: "#red" },
    { input: "?3", output: "#green" },
    { input: "?4#red", output: "#green", type: "redirect" },
    { input: "?5#green", output: "", type: "redirect"  }
  ].forEach(({ input, output, type="fetch" }) => {
    if (e.request.url.endsWith(`/images/colors.svg${input}`)) {
      const url = `/images/colors.svg${output}`;
      let response;
      if (type === "redirect") {
        response = Response.redirect(url);
      } else {
        response = fetch(url);
      }
      e.respondWith(response);
    }
  });
}
