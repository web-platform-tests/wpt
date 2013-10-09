def main(request, response):
    headers = [("Content-type", "text/plain"),
               ("X-Request-Method", request.method),
               ("X-Request-Query", request.url_parts.query if request.urlparts.query else "NO"),
               ("X-Request-Content-Length", request.headers.get("Content-Length", "NO")),
               ("X-Request-Content-Type", request.headers.get("Content-Type", "NO"))]

    if "content" in request.GET:
        content = request.GET("content");
    else:
        content = request.body

    return headers, content
