def main(request, response):
    if request.method == 'OPTIONS':
        # CORS preflight
        response.headers.set(b'Access-Control-Allow-Origin', '*')
        response.headers.set(b'Access-Control-Allow-Methods', '*')
        response.headers.set(b'Access-Control-Allow-Headers', '*')
        return 'done'

    url_dir = '/'.join(request.url_parts.path.split('/')[:-1]) + '/'
    key = request.GET.first(b"key")
    value = request.GET.first(b"value")
    request.server.stash.put(key, value, url_dir)
    response.headers.set(b'Access-Control-Allow-Origin', b'*')
    return "done"
