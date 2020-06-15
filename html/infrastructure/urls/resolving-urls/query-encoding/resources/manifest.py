def main(request, response):
    id = request.GET[b'id']
    mode = request.GET[b'mode']
    fallback_url = b""
    if mode == b"FALLBACK":
        fallback_url = b"fallback-namespace/"
    manifest = u"""CACHE MANIFEST

%s:
%s stash.py?q=\u00E5&id=%s&action=put
""" % (mode, fallback_url, id)
    return [(b"Content-Type", b"text/cache-manifest; charset=%s" % request.GET[b'encoding'])], manifest.encode('utf-8') # charset should be ignored for cache manifests
