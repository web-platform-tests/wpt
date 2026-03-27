import os
from wptserve.utils import isomorphic_encode

def main(request, response):
    response.headers.set(b"Content-Type", request.GET.first(b"type"))
    link = request.GET.first(b"link")
    response.headers.set(b"Access-Control-Allow-Origin", b"*")
    response.headers.set(b"Access-Control-Allow-Credentials", b"true")
    if link is not None:
        response.headers.set(b"Link", link)

    if b"file" in request.GET:
        base_dir = os.path.abspath(os.path.dirname(isomorphic_encode(__file__)))
        target_file = request.GET.first(b"file")
        path = os.path.abspath(os.path.join(base_dir, target_file))
        if not path.startswith(base_dir):
            response.status = 403
            return b"Forbidden"

        try:
            response.content = open(path, mode=u'rb').read()
        except IOError:
            response.status = 404
            return b"Not found"
    else:
        return request.GET.first(b"content")
