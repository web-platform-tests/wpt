etag = "abcdef"

def error(msg):
    return (299, "Client Error"), [
        ('content-type', 'text/plain'),
        ('access-control-allow-origin', "*"),
        ('cache-control', 'no-store')
    ], msg

def main(request, response):
    headers = []


    inm = request.headers.get('if-none-match', None)
    raw_req_num = request.headers.get('content-language', None)
    if raw_req_num == None:
        return error("no req_num header in request")
    else:
        req_num = int(raw_req_num)
        if req_num > 4:
            return error("req_num %s out of range" % req_num)

    headers.append(("A", req_num))
    headers.append(("B", req_num))

    if inm == etag:
        # A request with an If-None-Match header matching the stored etag
        if req_num == 1:
            return error("If-None-Match on first request")
        elif req_num == 2:
            headers.append(("Access-Control-Expose-Headers", "a, b"))
        elif req_num == 3:
            headers.append(("Access-Control-Expose-Headers", "a"))
        elif req_num == 4:
            headers.append(("Access-Control-Allow-Origin", "other.origin.example"))
        status = 304, "Not Modified"
        return status, headers, ""
    else:
        # INM is not present, or does not match
        if req_num != 1:
            if inm == None:
                return error("If-None-Match missing")
            else:
                return error("If-None-Match '%s' mismatches")
        status = 200, "OK"
        headers.append(("Access-Control-Allow-Origin", "*"))
        headers.append(("Content-Type", "text/plain"))
        headers.append(("Cache-Control", "private, max-age=3600"))
        headers.append(("ETag", etag))
        return status, headers, "Success"

