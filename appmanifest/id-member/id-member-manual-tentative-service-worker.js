// Some user agents only offer app installation if there is a SW and it handles
// offline requests.

self.addEventListener("fetch", e => {
  return fetch(e.request);
});
