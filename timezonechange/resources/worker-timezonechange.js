const oldtimezone = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
ontimezonechange = evt => {
  const timezone = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
  postMessage("SUCCESS:" + timezone);
};
postMessage("READY:" + oldtimezone);
