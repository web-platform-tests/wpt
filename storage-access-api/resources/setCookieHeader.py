from urllib.parse import unquote
from wptserve.utils import isomorphic_encode

def main(request, response):
  # Set the cors enabled headers.
  origin = request.headers.get(b"Origin")
  headers = []
  if origin is not None and origin != b"null":
      headers.append((b"Content-Type", b"text/plain"))
      headers.append((b"Access-Control-Allow-Origin", origin))
      headers.append((b"Access-Control-Allow-Credentials", 'true'))


  # Cookies may require whitespace (e.g. in the `Expires` attribute), so the
  # query string should be decoded.
  cookie = unquote(request.url_parts.query)
  headers.append((b"Set-Cookie", isomorphic_encode(cookie)))

  return (200, headers, "")

