def main(request, response):
    response.status = (request.GET.first("s"), "WHATEVES")
