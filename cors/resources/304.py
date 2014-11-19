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
        req_num = None
    else:
        req_num = int(raw_req_num)
        if req_num > 2:
            return error("req_num greater than 2")
    
    if inm == etag:
        if req_num and req_num != 2:
            return error("inm on wrong request")
        status = 304, "Not Modified"
        return status, headers, ""
    else:
        if req_num and req_num != 1:
            return error("no inm on second req")
        status = 200, "OK"
        headers.append(("Access-Control-Allow-Origin", "*"))
        headers.append(("Content-Type", "text/plain"))
        headers.append(("Cache-Control", "private, max-age=3600"))
        headers.append(("ETag", etag))
        return status, headers, "Success"

