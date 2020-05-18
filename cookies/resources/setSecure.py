from helpers import makeCookieHeader, readParameter, setNoCacheAndCORSHeaders

def main(request, response):
    """Respond to `/cookie/set/secure?{value}` by setting two cookies:
    alone_secure={value};secure;path=/`
    alone_insecure={value};path=/"""
    headers = setNoCacheAndCORSHeaders(request, response)
    value = request.url_parts.query

    headers.append(makeCookieHeader(u"alone_secure", value, {u"secure": u"",u"path": u"/"}))
    headers.append(makeCookieHeader(u"alone_insecure", value, {u"path": u"/"}))
    return headers, u'{"success": true}'
