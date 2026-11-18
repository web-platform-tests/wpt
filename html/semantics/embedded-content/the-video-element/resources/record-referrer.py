import base64

# A 1x1 transparent PNG, so the poster image source <img> loads successfully
# and we can focus the assertions on which Referer header the request carried.
TRANSPARENT_PNG = base64.b64decode(
    b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def main(request, response):
    if b"take" in request.GET:
        token = request.GET.first(b"take")
        value = request.server.stash.take(token)
        return [(b"Content-Type", b"text/plain")], value or b""

    token = request.GET.first(b"record")
    referer = request.headers.get(b"Referer", b"")
    request.server.stash.put(token, referer)
    return [(b"Content-Type", b"image/png")], TRANSPARENT_PNG
