# A support server that returns a resource to be cached for one year.
#
# However, if the request contains the "Cache-Control: only-if-cached;" header,
# the server returns status code 500, since such a request should never have
# reached it.
def main(request, response):
  if ("cache-control" in request._headers and
      request._headers["cache-control"] == "only-if-cached"):
    response.status = 500  # Internal server error.
    return

  return ([("Content-Type", "text/plain"),
           ("Cache-Control", "max-age=31536000")],
          "Resource to be cached for 365 days.")
