import urllib

def main(request, response):
    if "set" in request.GET:
        response.headers.append(b"Set-Cookie", b"cookiesarebananas=\xFFtest\xFF")
        response.content = "set"
    elif "get" in request.GET:
        response.content = urllib.quote(request.headers["Cookie"])
    elif "delete" in request.GET:
        request.headers.append(b"Set-Cookie", b"cookiesarebananas=meh;Max-Age=0")
        response.content = "delete"

    response.headers.append(b"Content-Type", "text/plain")
