importScripts('/common/get-host-info.sub.js');
importScripts('test-helpers.sub.js');

const storedResponse = new Response(new Blob(['a simple text file']))
const absolultePath = `${base_path()}/simple.txt`

self.addEventListener('fetch', event => {
    const search = new URLSearchParams(new URL(event.request.url).search.substr(1))
    const mode = search.get('mode')
    const delay = +search.get('delay')
    switch (mode) {
        case 'delay-before-fetch':
            event.respondWith(
                new Promise(resolve => {
                    setTimeout(() => fetch(event.request.url).then(resolve), delay)
            }))
            break
        case 'delay-after-fetch':
            event.respondWith(
            new Promise(resolve => {
                fetch(event.request.url)
                    .then(response => setTimeout(() => resolve(response), delay))
            }))
            break
        case 'delay-redirect-delay':
            event.respondWith(
                new Promise(resolve => {
                    setTimeout(() => {
                        fetch(`/xhr/resources/redirect.py?location=`)
                            .then(response => setTimeout(() => resolve(response), delay))
                    }, delay)
            }))
            break
        case 'redirect':
            event.respondWith(fetch(`/xhr/resources/redirect.py?location=${base_path()}/simple.txt`))
            break
        case 'generate':
            event.respondWith(new Response(new Blob(['a simple text file'])))
            break
        case 'generate-ahead-of-time':
            event.respondWith(storedResponse)
            break
        case 'forward':
            event.respondWith(fetch(event.request.url))
            break
        case 'passthrough':
            return
    }
});
