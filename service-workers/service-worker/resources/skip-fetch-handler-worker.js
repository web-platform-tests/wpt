self.addEventListener('message', function(event) {
    self.onfetch = (event) => {
      if (event.request.url.indexOf('pass.txt') >= 0) {
        event.respondWith(new Response('Intercepted!'));
      }
    };
    event.data.port.postMessage('Handler updated');
  });

if (new URL(self.location).searchParams.get('handler') === 'empty') {
  self.onfetch = () => {};
}
