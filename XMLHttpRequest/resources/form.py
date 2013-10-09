def main(request, response):
    echo "id:%s;value:%s;"(request.GET.first("id"), request.GET.first("value"))
