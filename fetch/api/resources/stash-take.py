from wptserve.handlers import json_handler


@json_handler
def main(request, response):
    dir = '/'.join(request.url_parts.path.split('/')[:-1]) + '/'
    key = request.GET.first("key")
    return request.server.stash.take(key, dir)
