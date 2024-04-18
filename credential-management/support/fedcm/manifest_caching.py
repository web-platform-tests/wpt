import importlib
import time
error_checker = importlib.import_module("credential-management.support.fedcm.request-params-check")

last_load_time_key = "abff7d6a-e997-4afa-9281-09a34595eaad"

def main(request, response):
  if b"read_last_load_time" in request.GET:
    response.headers.set(b"Access-Control-Allow-Origin", b"*")
    val = request.server.stash.take(last_load_time_key)
    if not val:
      return "0"
    return str(val)

  request_error = error_checker.manifestCheck(request)
  if (request_error):
    return request_error

  request.server.stash.put(last_load_time_key, time.time())
  response.headers.set(b"Content-Type", b"application/json")
  response.headers.set(b"Cache-Control", b"public, max-age=30")

  return """
{
  "accounts_endpoint": "accounts.py",
  "client_metadata_endpoint": "client_metadata.py",
  "id_assertion_endpoint": "token.py",
  "disconnect_endpoint": "disconnect.py",
  "login_url": "login.html"
}
"""
