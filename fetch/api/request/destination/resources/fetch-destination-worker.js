self.addEventListener('fetch', function(event) {
    if (event.request.url.indexOf('dummy') != -1) {
        let destination = new URL(event.request.url).searchParams.get("dest");
        if (event.request.destination == destination)
            event.respondWith(new Response());
        else
            event.respondWith(Response.error());
    }
});

