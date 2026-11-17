def main(request, response):
    key = request.GET.first(b"key")
    action = request.GET.first(b"action", b"svg")
    stash = request.server.stash

    with stash.lock:
        count = stash.take(key)
        if count is None:
            count = 0
        if action == b"count":
            stash.put(key, count)
            response.headers.set(b"Content-Type", b"text/plain")
            response.headers.set(b"Cache-Control", b"no-store")
            return str(count).encode("ascii")
        count += 1
        stash.put(key, count)

    response.headers.set(b"Content-Type", b"image/svg+xml")
    response.headers.set(b"Cache-Control", b"no-store")
    return b"""<svg xmlns="http://www.w3.org/2000/svg">
  <rect id="first" width="10" height="10" fill="red"/>
  <rect id="second" width="50" height="20" fill="green"/>
</svg>
"""
