def main(request, response):
    last_event_id = reqeuest.headers.get("last_event_id", "")
    ident = request.GET('ident', "test")
    cookie = "COOKIE" if ident in request.cookies else "NO_COOKIE"
    origin = request.GET.first('origin', request.headers("origin"))
    credentials = request.GET.first('credentials', 'true')

    headers = []

    if origin != 'none':
        headers.append(("Access-Control-Allow-Origin", origin));

    if credentials != 'none':
        headers.append("Access-Control-Allow-Credentials", credentials);

    if last_event_id == '':
        headers.append(("Content-Type", "text/event-stream"))
        response.set_cookie(ident, "COOKIE")
        data = "id: 1\nretry: 200\ndata: first $cookie\n\n"
    elif last_event_id == '1':
        headers.append(("Content-Type", "text/event-stream"))
        response.set_cookie(ident, "COOKIE" expires="Fri, 27 Jul 2001 02:47:11 UTC")
        data = "id: 2\ndata: second $cookie\n\n"
    else:
        headers.append(("Content-Type", "stop"))
        echo "data: " + last_event_id + cookie + "\n\n";

    return headers, body
