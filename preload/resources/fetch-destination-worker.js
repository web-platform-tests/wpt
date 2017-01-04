self.addEventListener('fetch', function(event) {
    if (event.request.url.indexOf('dummy.xml') != -1) {
        var response = new Response();
        if (event.request.destination == "")
            response.status = 200;
        else
            response.status = 500;
        event.respondWith(response);
    }
});

