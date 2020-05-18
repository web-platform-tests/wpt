from helpers import makeDropCookie, setNoCacheAndCORSHeaders

def main(request, response):
    """Respond to `/cookie/same-site/resources/dropSameSite.py by dropping the
    four cookies set by setSameSiteCookies.py"""
    headers = setNoCacheAndCORSHeaders(request, response)

    # Expire the cookies, and return a JSON-encoded success code.
    headers.append(makeDropCookie(u"samesite_strict", False))
    headers.append(makeDropCookie(u"samesite_lax", False))
    headers.append(makeDropCookie(u"samesite_none", False))
    headers.append(makeDropCookie(u"samesite_unspecified", False))
    return headers, u'{"success": true}'
