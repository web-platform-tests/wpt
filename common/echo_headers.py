import json
from wptserve.utils import isomorphic_decode


def main(request, response):
    headers = {};
    for key, value in request.headers.items():
        headers[isomorphic_decode(key)] = isomorphic_decode(request.headers[key])
    return ([("Content-Type", "application/json")], json.dumps(headers))
