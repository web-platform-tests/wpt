import os.path
import zlib
import gzip

def read(file):
    path = os.path.join(os.path.dirname(__file__), file)
    return open(path, u"rb").read()

def main(request, response):
    response.headers.set(b"Content-Type", b"text/javascript")

    if b'allow_origin' in request.GET:
        response.headers.set(b'access-control-allow-origin', request.GET.first(b'allow_origin'))

    if b'content_encoding' in request.GET:
        content_encoding = request.GET.first(b"content_encoding")
        response.headers.set(b"Content-Encoding", content_encoding)
        if content_encoding == b"deflate":
            response.content = zlib.compress(read(u"./content-encoding.js"))
        if content_encoding == b"gzip":
            response.content = gzip.compress(read(u"./content-encoding.js"))
        if content_encoding == b"br":
            # send pre compressed file
            response.content = read(u"./content-encoding.js.br")
        if content_encoding == b"zstd":
            # send pre compressed file
            response.content = read(u"./content-encoding.js.zstd")
