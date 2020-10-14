from .utils import return_hello


def main(request, response):
    response.headers.set(b"Cache-Control", b"no-cache")
    response.content = return_hello()
