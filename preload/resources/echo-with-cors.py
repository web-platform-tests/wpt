def main(request, response):
    response.headers.set(b"Content-Type", request.GET.first(b"type"))
    origin = request.headers.get('Origin')
    cache = request.GET.first(b'cache', None)

    if origin is not None:
        response.headers.set(b"Access-Control-Allow-Origin", origin)
        response.headers.set(b"Access-Control-Allow-Credentials", b"true")
        
    if cache is not None:
        response.headers.set(b"Cache-Control", cache)

    return request.GET.first(b"content")
