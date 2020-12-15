self.addEventListener('message', function(e) {
    const message = e.data;
    if ('port' in message) {
      const port = message.port;
      const oldTimeZone =
          (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
      self.addEventListener('timezonechange', function(evt) {
        const newTimeZone =
          (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
        port.postMessage('SUCCESS:' + newTimeZone);
      });
      port.postMessage('READY:' + oldTimeZone);
    }
});
