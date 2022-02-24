import json
import time

def main(request, response):
    uid = request.GET.first(b"uid")
    name = request.GET.first(b"name").decode("utf-8")

    if request.method == u"GET":
        time.sleep(.01)
        response.status = 200
        response.headers.set(b"Content-Type", b"application/json")
        current = {}
        with request.server.stash.lock:
            current = json.loads(request.server.stash.take(uid) or "{}")
            request.server.stash.put(uid, json.dumps(current))
        if name in current:
            response.content = json.dumps(current[name])
        else:
            response.content = "[]"

    elif request.method == u"POST":
        with request.server.stash.lock:
            current = json.loads(request.server.stash.take(uid) or "{}")
            current[name] = json.loads(request.body)
            request.server.stash.put(uid, json.dumps(current))
        response.status = 204
        return None
