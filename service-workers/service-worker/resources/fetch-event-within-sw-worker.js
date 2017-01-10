skipWaiting();

addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin == location.origin) {
    if (url.pathname.endsWith('/dummy.txt')) {
      event.respondWith(new Response('intercepted'));
      return;
    }

    if (url.pathname.endsWith('/dummy.txt-inner-fetch')) {
      event.respondWith(fetch('dummy.txt'));
      return;
    }

    if (url.pathname.endsWith('/dummy.txt-inner-cache')) {
      event.respondWith(
        caches.open('test-inner-cache').then(cache =>
          cache.add('dummy.txt').then(() => cache.match('dummy.txt'))
        )
      );
      return;
    }

    if (url.pathname.endsWith('/show-notification')) {
      event.respondWith(
        registration.showNotification('test', {
          icon: 'notification-icon.png'
        }).then(() => registration.getNotifications()).then(notifications => {
          for (const n of notifications) n.close();
          return new Response('done');
        })
      );
      return;
    }

    if (url.pathname.endsWith('/notification-icon.png')) {
      new BroadcastChannel('icon-request').postMessage('yay');
      event.respondWith(new Response('done'));
      return;
    }
  }
});
