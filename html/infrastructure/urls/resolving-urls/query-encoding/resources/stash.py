import time
import re

def main(request, response):
    key = request.GET['id']
    action = request.GET['action']
    if action == 'put':
        # We want the raw input for 'q'
        q = re.search(r'q=([^&]+)', request.url_parts.query).groups()[0]
        request.server.stash.put(key, q)
        return [("Content-Type", "text/html")], 'Put %s' % q
    else:
        i = 0
        while 1:
            q = request.server.stash.take(key)
            if q != None:
                break
            i += 1
            if i == 500:
                q = 'TIMEOUT'
                break
            time.sleep(0.01)
        return [("Content-Type", "text/html")], q
