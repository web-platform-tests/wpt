from datetime import datetime

# Beyond the 128-byte limit for `Last-Event-ID`
long_string = b"a" * 255

# A regular, safe `Last-Event-ID` value
safe_id_value = b"abc"

# CORS-unsafe request-header byte 0x3C (`<`) in `Last-Event-ID`
unsafe_id_value = b"e5p3n<3k0k0s"

def main(request, response):
    origin = request.headers.get(b"Origin")
    cors_request_headers = request.headers.get(b"Access-Control-Request-Headers")

    # Allow any CORS origin
    if origin is not None:
        response.headers.set(b"Access-Control-Allow-Origin", origin)

    # Allow any CORS request headers
    if cors_request_headers is not None:
        response.headers.set(b"Access-Control-Allow-Headers", cors_request_headers)

    # Expect a `token` in the query string
    if b"token" not in request.GET:
        headers = [(b"Content-Type", b"text/plain")]
        return 400, headers, b"ERROR: `token` query parameter!"

    # Expect a `fixture` in the query string
    if b"fixture" not in request.GET:
        headers = [(b"Content-Type", b"text/plain")]
        return 400, headers, b"ERROR: `fixture` query parameter!"

    # Prepare state
    fixture = request.GET.first(b"fixture")
    token = request.GET.first(b"token")
    last_event_id = request.headers.get(b"Last-Event-ID", b"")
    expect_preflight = fixture == b"unsafe" or fixture == b"long"

    # Preflight handling
    if request.method == u"OPTIONS":
        # The first request (without any `Last-Event-ID` header) should _never_ be a
        # preflight request, since it should be considered a "safe" request.
        # If we _do_ send a preflight for these requests, error early.
        if last_event_id == b"":
            headers = [(b"Content-Type", b"text/plain")]
            return 400, headers, b"ERROR: No Last-Event-ID header in preflight!"

        # We keep track of the different "tokens" we see, in order to tell whether or not
        # a client has done a preflight request. If the "stash" does not contain a token,
        # no preflight request was made.
        request.server.stash.put(token, cors_request_headers)

        # We can return with an empty body on preflight requests
        return b""

    # This will be a SSE endpoint
    response.headers.set(b"Content-Type", b"text/event-stream")
    response.headers.set(b"Cache-Control", b"no-store")

    # If we do not have a `Last-Event-ID` header, we're on the initial request
    # Respond with the fixture corresponding to the `fixture` query parameter
    if last_event_id == b"":
        if fixture == b"safe":
            return b"id: " + safe_id_value + b"\nretry: 200\ndata: safe\n\n"
        if fixture == b"unsafe":
            return b"id: " + unsafe_id_value + b"\nretry: 200\ndata: unsafe\n\n"
        if fixture == b"long":
            return b"id: " + long_string + b"\nretry: 200\ndata: long\n\n"
        return b"event: failure\ndata: unknown fixture\n\n"

    # If we have a `Last-Event-ID` header, we're on a reconnect.
    # If fixture is "unsafe", eg requires a preflight, check to see that we got one.
    preflight_headers = request.server.stash.take(token)
    saw_preflight = preflight_headers is not None
    if saw_preflight and not expect_preflight:
        return b"event: failure\ndata: saw preflight, did not expect one\n\n"
    elif not saw_preflight and expect_preflight:
        return b"event: failure\ndata: expected preflight, did not get one\n\n"

    if saw_preflight and preflight_headers.lower() != b"last-event-id":
        data = b"preflight `access-control-request-headers` was not `last-event-id`"
        return b"event: failure\ndata: " + data + b"\n\n"

    # Expect to have the same ID in the header as the one we sent.
    expected = b"<unknown>"
    if fixture == b"safe":
        expected = safe_id_value
    elif fixture == b"unsafe":
        expected = unsafe_id_value
    elif fixture == b"long":
        expected = long_string

    event = last_event_id == expected and b"success" or b"failure"
    data = b"got " + last_event_id + b", expected " + expected
    return b"event: " + event + b"\ndata: " + data + b"\n\n"
