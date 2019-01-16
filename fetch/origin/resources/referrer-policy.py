def main(request, response):
    if "referrerPolicy" in request.GET:
        response.status = 200
        response.headers.set("content-Type", "text/html")
        response.headers.set("Referrer-Policy",
                             request.GET.first("referrerPolicy"))