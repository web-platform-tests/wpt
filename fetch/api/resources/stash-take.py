from wptserve.handlers import json_handler


@json_handler
def main(request, response):
    dir = '/'.join(request.url_parts.path.split('/')[:-1]) + '/'
    key = request.GET.first(b"key")
    response.headers.set(b'Access-Control-Allow-Origin', b'*')
    return request.server.stash.take(key, dir)
