import os
import re

def main(request, response):
    type = request.GET['type']
    # We want the raw input for 'q'
    q = re.search(r'q=([^&]+)', request.url_parts.query).groups()[0]
    if type == 'html':
        return ([("Content-Type", "text/html")], q)
    elif type == 'css':
        return ([("Content-Type", "text/css")], "#test::before { content:'" + q + "' }")
    elif type == 'png':
        if q == '%E5':
            image = 'green-1x1.png'
        elif q == '%C3%A5':
            image = 'green-2x2.png'
        elif q == '%3F':
            image = 'green-16x16.png'
        else:
            image = 'green-256x256.png'
        rv = open(os.path.join(request.doc_root, "images", image)).read()
        return ([("Content-Type", "image/png")], rv)
