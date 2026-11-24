def main(request, response):
  service_worker_header = request.headers.get(b'service-worker')

  if b'header' in request.GET and service_worker_header != b'script':
    return 400, [(b'Content-Type', b'text/plain')], b'Bad Request'

  if b'no-header' in request.GET and service_worker_header == b'script':
    return 400, [(b'Content-Type', b'text/plain')], b'Bad Request'

  # no-cache itself to ensure the user agent finds a new version for each
  # update.
  headers = [(b'Cache-Control', b'no-cache, must-revalidate'),
             (b'Pragma', b'no-cache'),
             (b'Content-Type', b'application/javascript')]

  # Allows this script to be statically imported cross-origin by a module
  # service worker. Access-Control-Allow-Headers is deliberately not sent, so
  # a request with a Service-Worker header fails its CORS preflight.
  if b'cors' in request.GET:
    headers.append((b'Access-Control-Allow-Origin', b'*'))

  body = b'/* This is a service worker script */\n'

  if b'import' in request.GET:
    body += b"importScripts('%s');" % request.GET[b'import']

  if b'static-import' in request.GET:
    body += b"import '%s';" % request.GET[b'static-import']

  return 200, headers, body
