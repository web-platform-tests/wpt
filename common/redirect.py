from urlparse import urlparse

def main(request, response):
    """Simple handler that causes redirection.

    The request should typically have two query parameters:
    status - The status to use for the redirection. Defaults to 302.
    location - The resource to redirect to.
    """
    try:
        status = 302
        if "status" in request.GET:
            try:
                status = int(request.GET.first("status"))
            except ValueError:
                pass

        response.status = status

        location = request.GET.first("location")

        local_parsed = urlparse(location)
        request_parsed = urlparse(request.url)
        if local_parsed.hostname != None and local_parsed.hostname != request_parsed.hostname:
            return "illegal redirect url"

        response.headers.set("Location", location)

    except Exception:
        return "exception thrown"
