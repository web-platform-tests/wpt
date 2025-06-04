def main(request, response):
    csp = request.GET.first(b"policy") + bytes.fromhex(request.GET.first(b"hexbyte").decode("utf-8"))
    headers = [(b"Content-Type", b"text/html"), (b"Content-Security-Policy", csp)]


    body = u"""<!DOCTYPE html>
        <html>
        <head>
          <title>CSP.</title>
          <script>window.parent.postMessage('Loaded', '*');</script>
        </head>
        <body>
          Loaded
        </body>
        </html>
    """
    return (headers, body)
