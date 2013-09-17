def main(request, response):
    return "id:%s;value:%s;" % (request.GET.first("id"), request.GET.first("value"))
