import time


def main(request, response):
    mode = request.GET.first(b"mode")
    uid = request.GET.first(b"uid")
    purpose = request.headers.get(b"purpose")

    if (mode == b"get"):
        count = 0
        with request.server.stash.lock:
            count = request.server.stash.take(uid)
            if (count == None):
                count = 0
            request.server.stash.put(uid, count)
        return 200, [], str(count)

    if (mode == b"echo"):
        code = request.GET.first(b"code")
        content = request.GET.first(b"content")

        if (purpose != b'prefetch'):
            code = "200"

        with request.server.stash.lock:
            count = request.server.stash.take(uid)
            if (count == None):
                count = 0
            else:
                code = "200"

            request.server.stash.put(uid, count + 1)
        return int(code), [], content
