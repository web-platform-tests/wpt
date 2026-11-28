import json


def main(request, response):
    raw = request.headers.get("sec-gpc")
    if raw is None:
        value = None
    elif isinstance(raw, bytes):
        value = raw.decode("utf-8")
    elif isinstance(raw, list):
        value = [
            item.decode("utf-8") if isinstance(item, bytes) else item
            for item in raw
        ]
    else:
        value = raw
    payload = json.dumps({"sec-gpc": value}).encode("utf-8")
    return (
        200,
        [
            (b"Content-Type", b"application/json"),
            (b"Cache-Control", b"no-store"),
        ],
        payload,
    )
