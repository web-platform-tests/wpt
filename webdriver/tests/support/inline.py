"""Helpers for inlining extracts of documents in tests."""


def main(request, response):
    doc = request.GET.first(b"doc", None)
    mime = request.GET.first(b"mime", None)
    charset = request.GET.first(b"charset", None)

    if doc is None:
        return 404, [(b"Content-Type",
                      b"text/plain")], b"Missing doc parameter in query"

    content_type = []
    if mime is not None:
        content_type.append(mime)
    if charset is not None:
        content_type.append(b"charset=%s" % charset)

    headers = {b"X-XSS-Protection": b"0"}
    if len(content_type) > 0:
        headers[b"Content-Type"] = b";".join(content_type)

    return 200, headers.items(), doc
