def main(request, response):
    name = request.GET.first(b"name")
    value = request.GET.first(b"value")
    source_origin = request.headers.get(b"Origin", None)

    response_headers = [(b"Set-Cookie", name + b"=" + value),
                        (b"Access-Control-Allow-Credentials", b"true")]

    if source_origin:
        response_headers.append((b"Access-Control-Allow-Origin", source_origin))

    return (200, response_headers, u"")
