let evilGlobalState = null;
onfetch = e => {
  if(e.request.url.endsWith("resources/opaque-redirect.py")) {
    e.respondWith(new Promise(async resolve => {
      evilGlobalState = await fetch(e.request);
      resolve(new Response("stage 1 completed\n"));
    }));
  } else if(e.request.url.endsWith("resources/x/")) {
    e.respondWith(evilGlobalState);
  }
}
