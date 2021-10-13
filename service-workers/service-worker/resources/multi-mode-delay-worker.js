const aheadResponse = new Response(new Blob(['a simple text file']))

self.addEventListener('fetch', event => {
    const mode = new URLSearchParams(new URL(event.request.url).search.substr(1)).get('mode')
    const delay = 200
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
                        fetch(`/xhr/resources/redirect.py?location=${event.request.url}`)
                            .then(response => setTimeout(() => resolve(response), delay))
                    }, delay)
            }))
            break
        case 'redirect':
            event.respondWith(fetch(`/xhr/resources/redirect.py?location=${event.request.url}`))
            break
        case 'generate':
            event.respondWith(new Response(new Blob(['a simple text file'])))
            break
        case 'generate-ahead-of-time':
            event.respondWith(aheadResponse)
            break
        case 'forward':
            event.respondWith(fetch(event.request.url))
            break
        case 'passthrough':
            return
    }
});
