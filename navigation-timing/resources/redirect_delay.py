import time

def main(request, response):
    status = 302
    delay = 0
    if b"delay" in request.POST:
        delay = float(request.POST.first(b"delay"))

    time.sleep(delay)
    response.status = status
    location = request.POST.first(b"location")
    response.headers.set(b"Location", location)
