
import time

def main(request, response):
  time.sleep(1)

  headers = [("Content-Type", "text/javascript")]
  body = "window.didExecute = true;"

  return headers, body
