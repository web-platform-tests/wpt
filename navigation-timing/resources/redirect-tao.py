import time


def main(request, response):
    """Redirect handler that optionally sets a Timing-Allow-Origin header.

    Query parameters:
      status   - The status code to use for the redirection. Defaults to 302.
      location - The (percent-encoded) resource to redirect to.
      tao      - The value to send in the Timing-Allow-Origin response header. If
                 absent, no Timing-Allow-Origin header is sent (i.e. the redirect
                 does not opt in).
      delay    - Number of milliseconds to stall before responding. Pushes the
                 post-redirect timestamps well clear of the time origin, so that
                 they can be told apart from zero. Defaults to 0.
    """
    status = 302
    if b"status" in request.GET:
        try:
            status = int(request.GET.first(b"status"))
        except ValueError:
            pass

    delay = 0
    if b"delay" in request.GET:
        try:
            delay = int(request.GET.first(b"delay"))
        except ValueError:
            pass
    if delay > 0:
        time.sleep(delay / 1000.0)

    response.status = status
    location = request.GET.first(b"location")
    response.headers.set(b"Location", location)
    if b"tao" in request.GET:
        response.headers.set(b"Timing-Allow-Origin", request.GET.first(b"tao"))
