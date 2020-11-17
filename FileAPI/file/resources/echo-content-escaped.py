from wptserve.utils import isomorphic_encode

def escape_byte(byte):
    if "\0" <= byte <= "\x1F" or byte >= "\x7F":
        return "\\x%02x" % ord(byte)
    if byte == "\\":
        return "\\\\"
    return byte

def main(request, response):

    headers = [(b"X-Request-Method", isomorphic_encode(request.method)),
               (b"X-Request-Content-Length", request.headers.get(b"Content-Length", b"NO")),
               (b"X-Request-Content-Type", request.headers.get(b"Content-Type", b"NO")),
               # Avoid any kind of content sniffing on the response.
               (b"Content-Type", b"text/plain; charset=UTF-8")]

    content = "".join(map(escape_byte, request.body)).replace("\\x0d\\x0a", "\r\n")

    return headers, content
