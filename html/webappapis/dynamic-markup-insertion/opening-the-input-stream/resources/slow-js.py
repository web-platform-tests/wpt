import time


def main(request, response):
    token = request.GET[b"token"]
    response.headers.set(b"Cache-Control", b"no-store")

    if request.method == "POST":
        request.server.stash.put(token, True)
        return b""

    response.headers.set(b"Content-Type", b"text/javascript")
    response.write_status_headers()

    deadline = time.monotonic() + 5.0
    while request.server.stash.take(token) is None and time.monotonic() < deadline:
        if not response.writer.write(b"\n"):
            return
        time.sleep(0.01)

    response.writer.write(b"window.oldScriptRan = true;\n")
