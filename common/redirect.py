def main(request, response):
    status = 302
    if "status" in request.GET:
        try:
            status = int(request.GET.first("status"))
        except ValueError:
            pass

    response.status = status

    if "location" in request.GET:
        location = request.GET.first("location")
    else:
        #Not really sure this is useful to a lot of tests
        location = request.path + "?followed"
    
    response.headers.append(("Location", location))
