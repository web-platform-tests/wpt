import json
import time

def take_count(request, key):
    value = request.server.stash.take(key)
    return int(value) if value is not None else 0

def main(request, response):
    key = request.GET.first(b"token")
    is_query = request.GET.first(b"query", None) is not None

    response.headers.set(b"Cache-Control", b"no-store")

    if is_query:
        response.headers.set(b"Content-Type", b"application/json")
        with request.server.stash.lock:
            count = take_count(request, key)
            request.server.stash.put(key, count)
        return json.dumps({"count": count})

    response.headers.set(b"Content-Type", b"text/event-stream")

    try:
        with request.server.stash.lock:
            count = take_count(request, key)
            request.server.stash.put(key, count + 1)

        response.write_status_headers()
        if not response.writer.write("data: opened\n\n"):
            return

        while True:
            time.sleep(0.1)
            if not response.writer.write(": keepalive\n\n"):
                break
    finally:
        with request.server.stash.lock:
            count = take_count(request, key)
            request.server.stash.put(key, max(count - 1, 0))
