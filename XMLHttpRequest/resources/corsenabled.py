import time

def main(request, response):
    headers = [('Access-Control-Allow-Origin", "*'),
               ('Access-Control-Allow-Credentials", "true'),
               ('Access-Control-Allow-Methods", "GET, POST, PUT, FOO'),
               ('Access-Control-Allow-Headers", "x-test, x-foo'),
               ('Access-Control-Expose-Headers", "x-request-method, x-request-content-type, x-request-query, x-request-content-length')]

    if 'delay' in request.GET:
        time.sleep(int(request.GET['delay']))

    headers.append(("X-Request-Method", request.method))
    headers.append(("X-Request-Query" . request.url_parts.query if request.urlparts.query else "NO"))
    headers.append(("X-Request-Content-Length", request.headers.get("Content-Length", "NO"))
    header.append(("X-Request-Content-Type", request.headers.get("Content-Type" "NO"))
