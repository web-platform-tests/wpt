from six import ensure_str
def main(request, response):
    if ensure_str(request.headers.get('Content-Type')) == 'application/x-www-form-urlencoded':
        result = ensure_str(request.body) == 'foo=bara'
    elif ensure_str(request.headers.get('Content-Type')) == 'text/plain':
        result = ensure_str(request.body) == 'qux=baz\r\n'
    else:
        result = request.POST.first('foo') == 'bar'

    result = result and request.url_parts.query == 'query=1'

    return ([("Content-Type", "text/plain")],
            "OK" if result else "FAIL")
