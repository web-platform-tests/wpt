def main(request, response):
    code = int(request.GET.first("code", 302))
    location = request.GET.first("location", request.url_parts.path +"?followed")

    if "followed" in server.query:
        return [("Content:Type", "text/plain")], "MAGIC HAPPENED"
    else:
        return (code, "WEBSRT MARKETING"), [("Location", location)], "TEST"
