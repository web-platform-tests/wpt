let oldtimezone = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
ontimezonechange = evt => {
  let timezone = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
  postMessage("SUCCESS:" + timezone);
}
postMessage("READY:" + oldtimezone);
