let source = null;

async function getFetchResult(settledFetch) {
  if (!settledFetch.response)
    return;

  return {
    url: settledFetch.response.url,
    status: settledFetch.response.status,
    text: await settledFetch.response.text(),
  };
}

self.addEventListener('message', event => {
  source = event.source;
  source.postMessage('ready');
});

self.addEventListener('backgroundfetched', event => {
  event.waitUntil(
    event.match(new Request('resources/feature-name.txt'))
    .then(fetches => Promise.all(fetches.map(fetch => getFetchResult(fetch))))
    .then(results => source.PostMessage({type: event.type, results}))
  );
});

