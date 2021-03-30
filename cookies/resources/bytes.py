from six.moves.urllib.parse import quote


def main(request, response):
    if b"set" in request.GET:
        response.headers.append(
            b"Set-Cookie", b"cookiesarebananas=\xFFtest_utf8\xFF")
        response.content = "set"
    elif b"set_CR" in request.GET:
        response.headers.append(
            b"Set-Cookie", b"cookiesarebananas=\x0Dtest_cr")
        response.content = "set_CR"
    elif b"set_LF" in request.GET:
        response.headers.append(
            b"Set-Cookie", b"cookiesarebananas=\x0Atest_lf")
        response.content = "set_LF"
    elif b"set_NUL" in request.GET:
        response.headers.append(
            b"Set-Cookie", b"cookiesarebananas=\x00test_ nul")
        response.content = "set_NUL"
    elif b"set_CTL" in request.GET:
        response.headers.append(
            b"Set-Cookie", b"cookiesarebananas=\x0Ctest_ctl")
        response.content = "set_CTL"
    elif b"get" in request.GET:
        response.content = quote(request.headers.get(b"Cookie", "EMPTY"))
    elif b"delete" in request.GET:
        response.headers.append(
            b"Set-Cookie", b"cookiesarebananas=meh;Max-Age=0")
        response.content = "delete"

    response.headers.append(b"Content-Type", b"text/plain")
