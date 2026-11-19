def main(request, response):
    # Close the connection after each response so that a browser cannot reuse
    # it for a request to a different host. See
    # fetch/api/request/request-host-checks.tentative.window.js.
    response.close_connection = True
    return [(b"Content-Type", b"text/plain"), (b"Connection", b"close")], b"OK"
