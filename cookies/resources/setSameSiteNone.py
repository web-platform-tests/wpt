from helpers import makeCookieHeader, setNoCacheAndCORSHeaders

def main(request, response):
    """Respond to `/cookies/resources/setSameSiteNone.py?{value}` by setting two cookies:
    1. `samesite_none_insecure={value};SameSite=None;path=/`
    2. `samesite_none_secure={value};SameSite=None;Secure;path=/`
    """
    headers = setNoCacheAndCORSHeaders(request, response)
    value = request.url_parts.query

    headers.append(makeCookieHeader(u"samesite_none_insecure", value, {u"SameSite":u"None", u"path":u"/"}))
    headers.append(makeCookieHeader(u"samesite_none_secure", value, {u"SameSite":u"None", u"Secure":u"", u"path":u"/"}))

    return headers, u'{"success": true}'
