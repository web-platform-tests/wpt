def main(request, response):
    if request.GET[b"action"] == b"put":
        request.server.stash.put(request.GET[b"uuid"], str(request.raw_headers))
        return u''
    return request.server.stash.take(request.GET[b"uuid"])
