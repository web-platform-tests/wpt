self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    if (url.endsWith('?ignore')) {
      return;
    }
    const match = url.match(/\?name=(\w*)/)
    if (!match) {
      event.respondWith(Promise.reject(TypeError('No name is provided.')));
      return;
    }

    const name = match[1];
    const old_attribute = event.request[name];
    // If any of |init|'s member is present...
    const init = {cache: 'no-store'}
    const new_attribute = (new Request(event.request, init))[name];

    event.respondWith(
      new Response(`old: ${old_attribute}, new: ${new_attribute}`));
  });
