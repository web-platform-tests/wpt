
import time

def main(request, response):
  time.sleep(1)

  headers = [("Content-Type", "text/javascript")]

  result = request.GET.first("result", "successful")
  if result == "successful":
    body = "window.didExecute = true;"
  elif result == "parse-error":
    body = "1=2 parse error;"
  else:
    headers.append(("Transfer-encoding", "chunked"))
    body = "Invalid\r\nChunk\r\n"

  return headers, body
