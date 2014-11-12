def main(request, response):
  response.headers.set("Content-Type", "text/plain;charset=" + request.GET.first("label"))
  bytes = []
  for x in xrange(255):
      bytes.append(chr(x))
  response.content = "".join(bytes)
