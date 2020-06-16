def main(request, response):
    headers = []
    headers.append((b"Access-Control-Allow-Origin", b"*"))

    return headers, u"{ \"result\": \"success\" }"
