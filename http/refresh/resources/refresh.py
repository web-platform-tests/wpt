def main(request, response):
    response.headers.set("Content-Type", "text/plain")
    response.headers.set("Refresh", "0;./refreshed.txt")
    response.content = "Not refreshed.\n"
