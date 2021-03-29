from six.moves.urllib.parse import quote

def main(request, response):
    if b"set" in request.GET:
        response.headers.append(b"Set-Cookie", b"cookiesarebananas=\xFFtest\xFF")
        response.content = "set"
    elif b"get" in request.GET:
        response.content = quote(request.headers[b"Cookie"])
    elif b"set_ctl" in request.GET:
        response.headers.append(b"Set-Cookie", b"cookiesarebananas=\x0Dtest\x0C")
        response.content = "set_ctl"
    elif b"get_ctl" in request.GET:
        response.content = quote(request.headers[b"Cookie"])
    elif b"delete" in request.GET:
        response.headers.append(b"Set-Cookie", b"cookiesarebananas=meh;Max-Age=0")
        response.content = "delete"

    response.headers.append(b"Content-Type", b"text/plain")
