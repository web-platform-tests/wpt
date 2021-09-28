from datetime import datetime
import json

def main(request, response):
    stash = request.server.stash
    key = request.GET[b"key"]
    if (b"count" in request.GET):
        return [], str(stash.take(key))

    content = request.GET[b"content"]
    headers = request.GET[b"headers"]

    if headers is None:
        headers = []
    else:
        headers = json.loads(request.GET[b"headers"])

    count = stash.take(key)
    if count is None:
        count = 0

    count = count + 1

    stash.put(key, count)
    return headers, content