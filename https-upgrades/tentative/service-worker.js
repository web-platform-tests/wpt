self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.url.endsWith('/popup.html')) {
    const popup_html = `<!DOCTYPE html>
      <html>
        <body>
          SERVICE WORKER
          <script>
            window.onload = (event) => {
                window.opener.postMessage('SERVICE WORKER', '*');
            };
          </script>
        </body>
      </html>
      `;
    var headers = new Headers;
    headers.set('Content-Type', 'text/html; charset=UTF-8');
    event.respondWith(new Response(popup_html, { status: 200, headers: headers}));
  }
});
