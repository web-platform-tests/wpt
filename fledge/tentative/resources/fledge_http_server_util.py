# Takes a map of header names to list of values that are all binary strings
# and returns an otherwise identical map where keys and values have both been
# converted to ASCII strings.
def headersToAscii(headers):
  header_map = {}
  for pair in headers.items():
      values = []
      for value in pair[1]:
          values.append(value.decode("ASCII"))
      header_map[pair[0].decode("ASCII")] = values
  return header_map

def handle_cors(request, response):
  """Applies CORS logic common to many of the handlers.

  Args:
    request: the wptserve Request that was passed to main
    response: the wptserve Response that was passed to main

  Returns True if the request is a CORS prefetch, which is entirely handled by
  this function, so that the calling function should immediately return.
  """
  # Append CORS headers if needed
  if b"origin" in request.headers:
    response.headers.set(b"Access-Control-Allow-Origin",
        request.headers.get(b"origin"))

  if b"credentials" in request.headers:
    response.headers.set(b"Access-Control-Allow-Credentials",
        request.headers.get(b"credentials"))

  if not request.method == u"OPTIONS":
    return False

  # Handle CORS preflight requests
  if "Access-Control-Request-Method" not in request.headers:
    response.status = (400, b"Bad Request")
    response.headers.set(b"Content-Type", b"text/plain")
    response.content = str("Missing 'Access-Control-Request-Method' header")
    return True
  response.headers.set(b"Access-Control-Allow-Methods",
                       request.headers["Access-Control-Request-Method"])

  if "Access-Control-Allow-Headers" not in request.headers:
    response.status = (400, b"Bad Request")
    response.headers.set(b"Content-Type", b"text/plain")
    response.content = str("Missing 'Access-Control-Allow-Headers' header")
    return True
  response.headers.set(b"Access-Control-Allow-Headers",
                       request.headers["Access-Control-Allow-Headers"])

  response.status = (204, b"No Content")
  return True
