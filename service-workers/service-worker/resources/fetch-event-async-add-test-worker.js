var eventHandler = async function (event) {
  event.respondWith(new Response('codeSupposedUnreachable'));
};

self.addEventListener('message', function(event) {
  if (event.data == "addFetchEventListener") {
    self.addEventListener('fetch', eventHandler);
  }
});
