ETAG = '"123abc"'


def main(request, response):
    etag = request.headers.get("If-None-Match", None)

    if etag == ETAG:
        response.status = (304, "Not Modified")
        content = ""
    else:
        response.status = (200, "OK")
        response.headers.set("ETag", ETAG)
        content = etag or "N/A"

    response.headers.set("Content-Type", "text/plain")
    return content
