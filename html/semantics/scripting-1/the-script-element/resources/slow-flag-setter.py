
import time

def main(request, response):
  time.sleep(1)

  headers = [("Content-Type", "text/javascript")]

  if request.GET.first("result", "successful") == "successful":
    body = "window.didExecute = true;"
  else:
    headers.append(("Transfer-encoding", "chunked"))
    body = "Invalid\r\nChunk\r\n"

  return headers, body
