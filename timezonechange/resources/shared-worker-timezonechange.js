onconnect = connectEvent => {
  let oldtimezone = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
  const port = connectEvent.ports[0];
  ontimezonechange = () => {
    let timezone = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
    port.postMessage("SUCCESS:" + timezone);
  };
  port.postMessage("READY:" + oldtimezone);  // (the html will change the timezone)
}
