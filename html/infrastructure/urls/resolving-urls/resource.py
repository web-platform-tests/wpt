import os
import re

def main(request, response):
    type = request.GET['type']
    # We want the raw input for 'q'
    q = re.search(r'q=([^&]+)', request.url_parts.query).groups()[0]
    if type == 'html':
        return ([("Content-Type", "text/html; charset=utf-8")], q)
    elif type == 'css':
        return ([("Content-Type", "text/css; charset=utf-8")], "#test::before { content:'" + q + "' }")
    elif type == 'js':
        return ([("Content-Type", "text/javascript; charset=utf-8")], request.GET['var'] + " = '" + q + "';")
    elif type == 'worker':
        return ([("Content-Type", "text/javascript; charset=utf-8")], "postMessage('" + q + "'); close();")
    elif type == 'sharedworker':
        return ([("Content-Type", "text/javascript; charset=utf-8")], "onconnect = function(e) { e.source.postMessage('" + q + "'); close(); };")
    elif type == 'svg':
        return ([("Content-Type", "image/svg+xml")], "<svg xmlns='http://www.w3.org/2000/svg'>"+q+"</svg>")
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
    elif type == 'video':
        ext = request.GET['ext']
        if q == '%E5':
            video = 'A4' # duration: 3
        elif q == '%C3%A5':
            video = 'movie_5' # duration: 5
        elif q == '%3F':
            video = 'green-at-15' # duration: 30
        else:
            video = 'movie_300' # duration: 300
        rv = open(os.path.join(request.doc_root, "media", video + "." + ext)).read()
        if ext == 'ogv':
            ext = 'ogg'
        return ([("Content-Type", "video/" + ext)], rv)
    elif type == 'webvtt':
        return ([("Content-Type", "text/vtt")], "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n"+q)
