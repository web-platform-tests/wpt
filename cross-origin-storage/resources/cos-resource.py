import os


def main(request, response):
    """Serves bytes unique to the caller, for the COS host integration tests.

    Cross-Origin Storage persists across runs and is keyed by hash, so a test
    that needs bytes nothing has stored before mints them here.

    Query parameters:
      kind:    "text" (the default) serves `content` verbatim. "font" serves
               /fonts/Ahem.ttf followed by `token` as trailing padding, which
               leaves the font loadable while giving it a hash of its own.
      content: the body, for kind=text.
      token:   the unique padding, for kind=font.
      type:    the Content-Type (default text/plain, or font/ttf for fonts).
      allow:   if present, sent verbatim as the
               Cross-Origin-Storage-Allow-Origin response header.
    """
    kind = request.GET.first(b"kind", b"text")
    if kind == b"font":
        path = os.path.join(request.doc_root, u"fonts", u"Ahem.ttf")
        with open(path, u"rb") as f:
            body = f.read()
        token = request.GET.first(b"token", b"")
        body += b"\0" * (-len(body) % 4)
        body += token + b"\0" * (-len(token) % 4)
        content_type = request.GET.first(b"type", b"font/ttf")
    else:
        body = request.GET.first(b"content", b"")
        content_type = request.GET.first(b"type", b"text/plain")

    response.headers.set(b"Content-Type", content_type)
    if b"allow" in request.GET:
        response.headers.set(b"Cross-Origin-Storage-Allow-Origin",
                             request.GET.first(b"allow"))
    response.content = body
