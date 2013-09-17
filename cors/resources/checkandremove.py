def main(request, response):
    token = request.GET.first("token")
    try:
        request.server.stash.remove(token)
        return "1"
    except KeyError:
        return "0"
