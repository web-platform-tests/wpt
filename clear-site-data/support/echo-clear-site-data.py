import json

# A support server that receives a list of datatypes in the GET query
# and returns a Clear-Site-Data header with those datatypes. The content
# of the response is "report-status.html", a html site using postMessage
# to report the status of the datatypes, so that if used in an iframe,
# it can inform the embedder whether the data deletion succeeded.
def main(request, response):
    types = [key for key in request.GET.keys()]
    header = json.dumps({ "types": types })
    response = "Clear-Site-Data: %s" % header
    return ([("Clear-Site-Data", header),
             ("Content-Type", "text/html")],
            open("clear-site-data/support/report-status.html", "r").read())
