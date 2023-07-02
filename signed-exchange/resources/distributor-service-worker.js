self.addEventListener('fetch', event => {
  let url = new URL(event.request.url);
  if (url.pathname.endsWith('/resources/sxg')) {
    let {searchParams} = url;
    let sxgUrl = searchParams.get('url');
    let test = searchParams.get('test');
    switch (test) {
      case 'fetch':
        event.respondWith(fetch(sxgUrl));
          break;
      case 'clone':
        event.respondWith((async () => {
          let response = await fetch(sxgUrl);
          return response.clone();
        })());
        break;
      case 'blob':
        event.respondWith((async () => {
          let response = await fetch(sxgUrl);
          return new Response(await response.blob(), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        })());
        break;
      case 'transform':
        event.respondWith((async () => {
          let response = await fetch(sxgUrl);
          let body = response.body.pipeThrough(new TransformStream({
            transform: (chunk, controller) => {
              controller.enqueue(chunk);
            },
          }));
          return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        })());
        break;
    }
  }
});
