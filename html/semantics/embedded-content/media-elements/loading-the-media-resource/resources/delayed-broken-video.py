import time

# Responds with a non-media resource after a delay, so that the media element
# stays parked in the resource fetch algorithm for a while. Tests that need to
# mutate the media element's children while a candidate is pending can pass
# "ms" to widen that window.
def main(request, response):
  delay = 0.1
  if b"ms" in request.GET:
    delay = int(request.GET.first(b"ms")) / 1000
  time.sleep(delay)
  return [(b"Content-Type", b"text/plain")], u"FAIL"
