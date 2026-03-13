def main(request, response):
    stash = request.server.stash
    key = request.GET[b"key"]
    path = "client-hints/service-workers"
    value = stash.take(key=key, path=path)

    if request.GET[b"action"] == b"get":
        response.headers.append(b"Cache-Control", b"no-store")
        response.content = str(value)
        return

    if value is None:
        value = 1
    else:
        value += 1
    stash.put(key=key, value=value, path=path)

    response.status = 302
    response.headers.append(b"access-control-allow-origin", b"*")
    response.headers.append(b"location", request.GET[b"location"])
    response.headers.append(b"Cache-Control", b"no-store")
