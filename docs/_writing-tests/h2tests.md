# Writing H2 Tests
> <b>Important:</b> The HTTP/2.0 server requires you to have Python 2.7.10+
and OpenSSL 1.0.2+. This is because HTTP/2.0 is negotiated using the
[TLS ALPN](https://tools.ietf.org/html/rfc7301) extension, which is only supported in [OpenSSL 1.0.2](https://www.openssl.org/news/openssl-1.0.2-notes.html) and up.

These instructions assume you are already familiar with the testing
infrastructure and know how to write a standard HTTP/1.1 test.

On top of the standard `main` handler that the H1 server offers, the
H2 server also offers support for specific frame handlers in the Python
scripts. Currently there is support for for `handle_headers` and `handle_data`.
Unlike the `main` handler, these  are run whenever the server receives a
HEADERS frame (RequestReceived event) or a DATA frame (DataReceived event).
`main` can still be used, but it will be run after the server has received
the request in its entirety.

Here is what a Python script for a test might look like:
```python
def handle_headers(frame, request, response):
    if request.headers["test"] == "pass":
        response.status = 200
        response.headers.update([('test', 'passed')])
        response.write_status_headers()
    else:
        response.status = 403
        response.headers.update([('test', 'failed')])
        response.write_status_headers()
        response.writer.end_stream()

def handle_data(frame, request, response):
    response.writer.write_data(frame.data[::-1])

def main(request, response):
    response.writer.write_data('\nEnd of File', last=True)
```

The above script is fairly simple:
1. Upon receiving the HEADERS frame, `handle_headers` is run.
    - This checks for a header called 'test' and checks if it is set to 'pass'.
    If true, it will immediately send a response header, otherwise it responds
    with a 403 and ends the stream.
2. Any DATA frames received will then be handled by `handle_data`. This will
simply reverse the data and send it back.
3. Once the request has been fully received, `main` is run which will send
one last DATA frame and signal its the end of the stream.

The H2Response API is pretty much the same as the H1 variant, the main API
difference lies in the H2ResponseWriter which is accessed through `response.writer`,
which is detailed in the [H2ResponseWriter API][h2responsewriter] section.

[h2responsewriter]: {{ site.baseurl }}{% link _writing-tests/h2responsewriter.md %}
