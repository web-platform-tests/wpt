def main(request, response):
    headers = [("Content-type", "text/plain")]
    content = request.method

    return headers, content
