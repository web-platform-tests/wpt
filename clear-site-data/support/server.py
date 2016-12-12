import json

KNOWN_DATATYPES = ["cookies", "storage", "cache"]

# A support server that receives a list of datatypes in the GET query
# and returns a Clear-Site-Data header with those datatypes.
def main(request, response):
    types = [key for key in request.GET.keys() if key in KNOWN_DATATYPES]
    header = json.dumps({ "types": types })
    response = "Clear-Site-Data: %s" % header
    return [("Clear-Site-Data", header)], response
