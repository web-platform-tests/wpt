def main(request, response):
    response.headers.set("Content-Type", "text/plain")
    response.headers.set("Refresh", "0;./refreshed.txt?\xFF")
    response.content = "Not refreshed.\n"
