import time

from six import PY3

def main(request, response):
    # no-cache itself to ensure the user agent finds a new version for each update.
    headers = [(b'Cache-Control', b'no-cache, must-revalidate'),
               (b'Pragma', b'no-cache')]

    # Set a normal mimetype.
    content_type = b'application/javascript'

    headers.append((b'Content-Type', content_type))
    # Return a different script for each access.  Use .time() and .clock() for
    # best time resolution across different platforms.
    return headers, u'// %s %s' % (time.time(), time.perf_counter() if PY3 else time.clock())
