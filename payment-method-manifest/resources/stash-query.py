"""
HTTP query endpoint for inspecting server access logs stashed by manifest-server.py.

Given a `id` query parameter, this handler reads and returns the JSON list of
recorded request objects (containing step, HTTP method, URL, and headers) logged
for that specific test run.

Supports CORS (Access-Control-Allow-Origin: *) to allow cross-origin test scripts
to query server access logs.
"""

import json

STASH_PATH = "/payment-method-manifest/resources/"


def main(request, response):
    test_id = request.GET.get(b"id")
    response.headers.set(b"Content-Type", b"application/json")
    response.headers.set(b"Access-Control-Allow-Origin", b"*")

    if not test_id:
        response.status = 400
        response.body = json.dumps({"error": "missing id"}).encode("utf-8")
        return

    stash = request.server.stash
    with stash.lock:
        logs = stash.take(test_id, path=STASH_PATH) or []
        if logs:
            # Preserve logs in stash for potential subsequent assertions
            stash.put(test_id, logs, path=STASH_PATH)

    response.status = 200
    response.body = json.dumps(logs).encode("utf-8")
