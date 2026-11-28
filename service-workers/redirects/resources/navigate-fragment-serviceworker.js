onfetch = e => {
  // Changing this list requires corresponding changes in ../navigate-and-fragment.https.window.js
  const path = new URL("dummy.html", location).pathname;
  [
    { input: "?1#test", output: "" },
    { input: "?2#test", output: "#there", type: "redirect" },
    { input: "?3#test" ,output: "", type: "redirect" },
    { input: "?4", output: "#blah" }
  ].forEach(({ input, output, type="fetch" }) => {
    if (e.request.url.endsWith(`${path}${input}`)) {
      const url = `${path}${output}`;
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
