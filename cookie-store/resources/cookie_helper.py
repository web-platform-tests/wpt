#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Active wptserve handler for cookie operations.
#
# This must support the following requests:
#
# - GET with the following query parameters:
#   - charset: (optional) character set for response (default: utf-8)
#   A cookie: request header (if present) is echoed in the body with a
#   cookie= prefix followed by the urlencoded bytes from the header.
#   Used to inspect the cookie jar from an HTTP request header context.
# - POST with form-data in the body and the following query-or-form parameters:
#   - set-cookie: (optional; repeated) echoed in the set-cookie: response
#     header and also echoed in the body with a set-cookie= prefix
#     followed by the urlencoded bytes from the parameter; multiple occurrences
#     are CRLF-delimited.
#   Used to set cookies from an HTTP response header context.
#
# The response has 200 status and content-type: text/plain; charset=<charset>
import encodings, re

from six.moves.urllib.parse import parse_qs, quote

from wptserve.utils import isomorphic_decode, isomorphic_encode

# NOTE: These are intentionally very lax to permit testing
DISALLOWED_IN_COOKIE_NAME_RE = re.compile(r'[;\0-\x1f\x7f]')
DISALLOWED_IN_HEADER_RE = re.compile(r'[\0-\x1f\x7f]')

# Ensure common charset names do not end up with different
# capitalization or punctuation
CHARSET_OVERRIDES = {
    encodings.codecs.lookup(charset).name: charset
    for charset in (u'utf-8', u'iso-8859-1',)
}

def main(request, response):
  assert request.method in (
      u'GET',
      u'POST',
  ), u'request method was neither GET nor POST: %r' % request.method
  qd = (request.url.encode("utf-8").split(b'#')[0].split(b'?', 1) + [b''])[1]
  if request.method == u'POST':
    qd += b'&' + request.body
  args = parse_qs(qd, keep_blank_values = True)
  charset = encodings.codecs.lookup(args.get(u'charset', [u'utf-8'])[-1]).name
  charset = CHARSET_OVERRIDES.get(charset, charset)
  headers = [(b'content-type', b'text/plain; charset=' + isomorphic_encode(charset))]
  body = []
  if request.method == u'POST':
    for set_cookie in args.get(b'set-cookie', []):
      if b'=' in set_cookie.split(b';', 1)[0]:
        name, rest = set_cookie.split(b'=', 1)
        assert re.search(
            DISALLOWED_IN_COOKIE_NAME_RE,
            isomorphic_decode(name)
        ) is None, b'name had disallowed characters: %r' % name
      else:
        rest = set_cookie
      assert re.search(
          DISALLOWED_IN_HEADER_RE,
          isomorphic_decode(rest)
      ) is None, b'rest had disallowed characters: %r' % rest
      headers.append((b'set-cookie', set_cookie))
      body.append(u'set-cookie=' + quote(set_cookie, b''))
  else:
    cookie = request.headers.get(b'cookie')
    if cookie is not None:
      body.append(u'cookie=' + quote(cookie, b''))
  body = u'\r\n'.join(body)
  headers.append((b'content-length', isomorphic_encode(str(len(body)))))
  return 200, headers, body
