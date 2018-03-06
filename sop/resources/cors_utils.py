# cors function
# This function sets CORS header according to the get parameter given in the request
#
def cors(request, response):
    originA = "http://" + request.server.config["domains"][""] + ":" + str(request.server.config["ports"]["http"][0])
    originB = "http://" + request.server.config["domains"]["www2"] + ":" + str(request.server.config["ports"]["http"][0])

    if "origin" in request.GET:
        origin = request.GET.first("origin")

        if origin == "A":
            response.headers.set("Access-Control-Allow-Origin", originA)
        elif origin == "B":
            response.headers.set("Access-Control-Allow-Origin", originB)
        elif origin == "wildcard":
            response.headers.set("Access-Control-Allow-Origin", "*")

    if "credentials" in request.GET:
        credentials = request.GET.first("credentials")

        if credentials == "true":
            response.headers.set("Access-Control-Allow-Credentials", "true")
        elif credentials == "false":
            response.headers.set("Access-Control-Allow-Credentials", "false")