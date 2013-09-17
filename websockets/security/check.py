def main(request, response):
    return "PASS" if 'Sec-WebSocket-Key' in request.headers else "FAIL"
