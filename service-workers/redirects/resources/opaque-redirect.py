def main(request, response):
    response.status = 302
    response.headers.set("Location", "opaque-redirect-result.txt")
