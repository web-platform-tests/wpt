self.onmessage = event => {
  if (event.data !== 'test-shownotification') return;

  const random = Math.random().toString();
  const start = Date.now();

  event.waitUntil(
    self.registration.showNotification('test', {
      tag: random,
      icon: 'icon.png?pipe=trickle(d2)'
    }).then(() => {
      const resolveDuration = Date.now() - start;

      return self.registration.getNotifications().then(notifications => {
        event.source.postMessage({
          type: 'notification-data',
          resolveDuration,
          notificationReturned: notifications.some(n => n.tag == random)
        });
      });
    })
  );
};