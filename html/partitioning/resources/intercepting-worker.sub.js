self.addEventListener("fetch", (event) => {
  let url = new URL(event.request.url);
  if (url.searchParams.has("intercept")) {
    if (url.hostname == "{{hosts[][]}}") {
      url.hostname = "{{hosts[alt][www]}}"
    } else {
      url.hostname = "{{hosts[][]}}";
    }
    return event.respondWith(fetch(url));
  }
});
