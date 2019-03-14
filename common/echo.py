def main(request, response):
    response.headers.set("Content-Type", "text/html")
    response.content = request.GET.first("content")
