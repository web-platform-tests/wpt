def main(request, response):
    # Redirects a POST request to the reload_post_1-1.html file
    # Returns 404 on GET request

    if request.method == "GET":
        response.status = 404
        return

    status = 302

    response.status = status

    location = "/html/browsers/history/the-location-interface/reload_post_1-1.html"

    response.headers.set("Location", location)
