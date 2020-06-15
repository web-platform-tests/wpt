def main(request, response):
    encoding = request.GET[b'encoding']
    tmpl = request.GET[b'tmpl']
    sheet = tmpl % b'\\0000E5'
    return [(b"Content-Type", b"text/css; charset=%s" % encoding)], sheet
