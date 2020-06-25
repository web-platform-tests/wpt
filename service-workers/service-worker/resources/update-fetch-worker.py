import time

from six import PY3

def main(request, response):
    # no-cache itself to ensure the user agent finds a new version for each update.
    headers = [(b'Cache-Control', b'no-cache, must-revalidate'),
               (b'Pragma', b'no-cache')]

    content_type = b''
    extra_body = u''

    content_type = b'application/javascript'
    headers.append((b'Content-Type', content_type))

    extra_body = u"self.onfetch = (event) => { event.respondWith(fetch(event.request)); };"

    # Return a different script for each access.  Use .time() and .clock() for
    # best time resolution across different platforms.
    return headers, u'/* %s %s */ %s' % (time.time(), time.perf_counter() if PY3 else time.clock(), extra_body)
