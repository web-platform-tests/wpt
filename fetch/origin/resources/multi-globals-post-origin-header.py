import json

from wptserve.utils import isomorphic_decode

def main(request, response):
    headers = [
        (b"Content-Type", b"text/html"),
        (b"Cache-Control", b"no-cache, no-store, must-revalidate")
    ]
    origin = request.headers.get(b"Origin", b"")

    body = u"""
        <!DOCTYPE html>
        <meta charset="utf-8">
        <title>Destination</title>
        <h1>Destination</h1>
        <script>
        "use strict";
        window.top.postMessage("%s", "*");
        </script>
        """ % isomorphic_decode(origin)

    return headers, body
