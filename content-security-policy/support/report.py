import time
import json
import re

def main(request, response):
    op = request.GET.first("op");
    key = request.GET.first("reportID")
    cookie_key = re.sub('^....', 'cccc', key)
    count_key = re.sub('^....', 'dddd', key)

    if op == "retrieve_report":
        timeout = float(request.GET.first("timeout"))
        t0 = time.time()
        while time.time() - t0 < timeout:
            time.sleep(0.5)
            value = request.server.stash.take(key=key)
            if value is not None:
                return [("Content-Type", "application/json")], value

        return [("Content-Type", "application/json")], json.dumps({'error': 'No such report.' , 'guid' : key})

    if op == "retrieve_cookies":
        cval = request.server.stash.take(key=cookie_key)
        if cval is None:
            cval = "\"None\""

        return [("Content-Type", "application/json")], "{ \"reportCookies\" : " + cval + "}"

    if hasattr(request, 'Cookies'):
        request.server.stash.put(key=cookie_key, value=request.Cookies)

    report = request.body
    report.rstrip()
    with request.server.stash.lock:
        request.server.stash.take(key=key)
        request.server.stash.put(key=key, value=report)

    with request.server.stash.lock:
        # increment report count
        count = request.server.stash.take(key=count_key)
        if count is None:
          count = 0
        count += 1
        request.server.stash.put(key=count_key, value=count)

    return [("Content-Type", "text/plain")], "Recorded report " + report
