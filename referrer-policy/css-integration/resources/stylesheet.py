def main(request, response):
    """Serves the `css` query parameter as a style sheet.

    If the `referrer-policy` query parameter is given, the style sheet is
    served with a `Referrer-Policy` header with its value. Otherwise, it is
    served without a `Referrer-Policy` header.
    """
    headers = [(b"Content-Type", b"text/css"),
               (b"Cache-Control", b"no-store")]
    if b"referrer-policy" in request.GET:
        headers.append(
            (b"Referrer-Policy", request.GET.first(b"referrer-policy")))
    return 200, headers, request.GET.first(b"css")
