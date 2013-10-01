import os

def run_other(request, response, path):
    #This is a terrible hack
    environ = {"__file__": path}
    execfile(path, environ, environ)
    rv = environ["main"](request, response)
    return rv

def main(request, response):

    print request.request_line
    print request._raw_headers

    origin = request.GET.first("origin", request.headers["origin"])
    credentials = request.GET.first("credentials", "true")

    response.headers.update([("Access-Control-Allow-Origin", origin),
                             ("Access-Control-Allow-Credentials", credentials)])

    handler = request.GET.first('run')
    if handler in ["status-reconnect",
                   "message",
                   "redirect",
                   "cache-control"]:
        if handler == "cache-control":
            return open("cache-control.event_source").read()
        elif handler == "redirect":
            return run_other(request, response, os.path.join(request.doc_root, "common", "redirect.py"))
        else:
            return run_other(request, response, os.path.join(os.path.split(__file__)[0], handler + ".py"))
    else:
        return
