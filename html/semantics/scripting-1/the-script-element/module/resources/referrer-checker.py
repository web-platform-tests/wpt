from six import ensure_str
def main(request, response):
    referrer = ensure_str(request.headers.get("referer", ""))
    response_headers = [("Content-Type", "text/javascript"),
                        ("Access-Control-Allow-Origin", "*")]
    return (200, response_headers,
            "export const referrer = '" + referrer + "';")
