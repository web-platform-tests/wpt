def main(request, response):
    response.status = (302, "WHATEVES")
    response.headers.set("Location", request.GET.first("r"))
