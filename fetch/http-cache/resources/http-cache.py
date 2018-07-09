#!/usr/bin/env python

import json
from base64 import b64decode

NOTEHDRS = set(['content-type', 'access-control-allow-origin', 'last-modified', 'etag'])
NOBODYSTATUS = set([204, 304])
LOCATIONHDRS = set(['location', 'content-location'])

def main(request, response):
    dispatch = request.GET.first("dispatch", None)
    uuid = request.GET.first("uuid", None)
    if not uuid:
        response.status = (404, "Not Found")
        response.headers.set("Content-Type", "text/plain")
        return "UUID not found"
    if dispatch == 'test':
        return handle_test(uuid, request, response)
    elif dispatch == 'state':
        return handle_state(uuid, request, response)
    response.status = (404, "Not Found")
    response.headers.set("Content-Type", "text/plain")
    return "Fallthrough"

def handle_state(uuid, request, response):
    response.headers.set("Content-Type", "text/plain")
    return json.dumps(request.server.stash.take(uuid))

def handle_test(uuid, request, response):
    server_state = request.server.stash.take(uuid) or []
    try:
        requests = json.loads(b64decode(request.headers.get('Test-Requests', "")))
    except:
        response.status = (400, "Bad Request")
        response.headers.set("Content-Type", "text/plain")
        return "No or bad Test-Requests request header"
    config = requests[len(server_state)]
    if not config:
        response.status = (404, "Not Found")
        response.headers.set("Content-Type", "text/plain")
        return "Config not found"
    previous_config = requests[len(server_state) - 1]
    state = {
        'request_method': request.method,
        'request_headers': dict([[h.lower(), request.headers[h]] for h in request.headers])
    }
    server_state.append(state)
    request.server.stash.put(uuid, server_state)

    noted_headers = {}
    for header in config.get('response_headers', []):
        if header[0].lower() in LOCATIONHDRS: # magic!
            header[1] = "%s&target=%s" % (request.url, header[1])
        response.headers.set(header[0], header[1])
        if header[0].lower() in NOTEHDRS:
            noted_headers[header[0].lower()] = header[1]

    if "access-control-allow-origin" not in noted_headers:
        response.headers.set("Access-Control-Allow-Origin", "*")
    if "content-type" not in noted_headers:
        response.headers.set("Content-Type", "text/plain")
    response.headers.set("Server-Request-Count", len(server_state))

    code, phrase = config.get("response_status", [200, "OK"])
    if config.get("expected_type", "").endswith('validated'):
        previous_lm = get_header(previous_config['response_headers'], 'Last-Modified')
        if previous_lm and request.headers.get("If-Modified-Since", False) == previous_lm:
            code, phrase = [304, "Not Modified"]
        previous_etag = get_header(previous_config['response_headers'], 'ETag')
        if previous_etag and request.headers.get("If-None-Match", False) == previous_etag:
            code, phrase = [304, "Not Modified"]
        if code != 304:
            code, phrase = [999, '304 Not Generated']

    response.status = (code, phrase)

    content = config.get("response_body", uuid)
    if code in NOBODYSTATUS:
        return ""
    return content


def get_header(headers, header_name):
    result = None
    for header in headers:
        if header[0].lower() == header_name.lower():
            result = header[1]
    return result
