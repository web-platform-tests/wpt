import json

def main(request, response):
    key = request.GET.first("stash")
    origin = request.headers.get("origin")
    if origin is None:
        origin = "no Origin header"

    origin_list = request.server.stash.take(key)

    if "dump" in request.GET:
        response.headers.set("content-Type", "application/json")
        response.content = json.dumps(origin_list)
        return

    if origin_list is None:
        origin_list = [origin]
    else:
        origin_list.append(origin)

    request.server.stash.put(key, origin_list)

    if "referrerPolicy" in request.GET:
        response.status = 200
        response.headers.set("content-Type", "text/html")
        response.headers.set("Referrer-Policy",
                             request.GET.first("referrerPolicy"))
        return

    if "location" in request.GET:
        response.status = 308
        response.headers.set("Location", request.GET.first("location"))
        return

    response.headers.set("content-Type", "text/html")
    response.content = "<script>parent.postMessage('loaded','*')</script>"
