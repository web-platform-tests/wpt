# Diagnostic helper for candidate_dump.https.window.js; not used by any test.
#
# Stores the JSON report POSTed by the page as
# $WEBNN_CANDIDATE_DUMP_DIR/<name>.json. The directory comes only from the
# environment of the wptserve process, never from the request, so a page cannot
# choose where the server writes. When the variable is unset the handler stores
# nothing and answers 501, and the page reports that it did not save.
import json
import os
import re

ENV_VAR = "WEBNN_CANDIDATE_DUMP_DIR"
# One path component: no separators, no leading dot.
NAME_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,199}")
MAX_BODY_BYTES = 256 * 1024 * 1024


def text_response(status, message):
    return status, [(b"Content-Type", b"text/plain")], message.encode("utf-8")


def main(request, response):
    if request.method != "POST":
        return text_response(405, "POST only")

    out_dir = os.environ.get(ENV_VAR)
    if not out_dir:
        return text_response(
            501, ENV_VAR + " is not set in the server environment")

    name = request.GET.first(b"name", b"").decode("ascii", "replace")
    if NAME_RE.fullmatch(name) is None:
        return text_response(
            400, "name must match " + NAME_RE.pattern)

    body = request.body
    if len(body) > MAX_BODY_BYTES:
        return text_response(413, "report larger than %d bytes" % MAX_BODY_BYTES)
    try:
        json.loads(body)
    except ValueError:
        return text_response(400, "body is not JSON")

    root = os.path.realpath(out_dir)
    path = os.path.realpath(os.path.join(root, name + ".json"))
    if os.path.dirname(path) != root:
        return text_response(400, "name escapes the output directory")

    os.makedirs(root, exist_ok=True)
    with open(path, "wb") as f:
        f.write(body)
    return text_response(200, path)
