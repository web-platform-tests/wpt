from wptserve.handlers import json_handler


@json_handler
def main(request, response):
    key = request.GET.first(b"key")
    peek = b"peek" in request.GET

    take = request.server.stash.take(key, b'/fetch/range/')
    if take and peek:
        request.server.stash.put(key, take, b'/fetch/range/')
    return take
