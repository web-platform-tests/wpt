def main(request, response):
    policy = request.GET.first(b"policy");
    return [(b"Content-Type", b"text/html"), (b"Content-Security-Policy", policy)], u"<!DOCTYPE html><title>Echo.</title>"
