"""Methods for the interest group cross-origin permissions endpoint."""
import json

from fledge.tentative.resources import fledge_http_server_util

def get_permissions(request, response):
  if fledge_http_server_util.handle_cors(request, response):
    return

  response.status = (200, b"OK")
  response.headers.set(b"Content-Type", b"application/json")
  response.content = json.dumps({
    "joinAdInterestGroup": True,
    "leaveAdInterestGroup": True
  })

