def main(request, response):
    type = request.GET.first("type")
    subtype = request.GET.first("subtype")
    if type and subtype:
        response.headers["Content-Type"] = type + "/" + subtype

    removeContentType = request.GET.first("removeContentType")
    if removeContentType:
        del response.headers["Content-Type"]

    content = ''
    mimeHead = request.GET.first("mime");
    if mimeHead:
        content = '<meta http-equiv="Content-Type" content="%s; charset=utf-8"/>' % mimeHead

    return content
