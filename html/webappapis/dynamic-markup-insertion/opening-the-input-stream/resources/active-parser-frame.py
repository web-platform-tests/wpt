def main(request, response):
    token = request.GET.first(b"token", b"0")
    body = (
        b'<!DOCTYPE html>\n'
        b'<div id="before-open">initial</div>\n'
        b'<script>setTimeout(() => window.parent.onFrameActiveParserReady(), 0);</script>\n'
        b'<script src="slow-js.py?token=' + token + b'"></script>\n'
        b'<div id="after-blocked-script">unreachable</div>\n'
    )
    return 200, [(b"Content-Type", b"text/html; charset=utf-8"), (b"Cache-Control", b"no-store")], body
