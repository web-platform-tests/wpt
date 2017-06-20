import json

def main(request, response):
    types = [key for key in request.GET.keys()]
    header = json.dumps(types)
    return ([("Clear-Site-Data", header),
             ("Access-Control-Allow-Credentials", "true"),
             ("Access-Control-Allow-Origin", request.headers["origin"]),
             ("Content-Type", "text/html")],
             "Cleared.")
