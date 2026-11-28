self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(new Response("<!doctype html>", {
      headers: { "Content-Type": "text/html" }
    }));
    return;
  }
  if (new URL(event.request.url).searchParams.has("passthrough")) {
    event.respondWith(fetch(event.request));
    return;
  }
  const target = new URL(event.request.url).searchParams.get("url");
  if (target) {
    event.respondWith(fetch(target, { mode: "no-cors" }));
  }
});

self.addEventListener("message", event => {
  fetch(event.data, { mode: "no-cors" }).then(
    response => event.source.postMessage({ type: response.type }),
    error => event.source.postMessage({ error: error.name }));
});
