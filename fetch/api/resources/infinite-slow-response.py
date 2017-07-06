import time


def stash_write(request, key, value):
    """Write to the stash, overwriting any previous value"""
    dir = '/'.join(request.url_parts.path.split('/')[:-1]) + '/'
    request.server.stash.take(key, dir)
    request.server.stash.put(key, value, dir)


def main(request, response):
    key = request.GET.first("key", "")

    if key:
        stash_write(request, key, 'open')

    response.headers.set("Content-type", "text/plain")
    response.write_status_headers()

    # Writing an initial 2k so browsers realise it's there. *shrug*
    response.writer.write("." * 2048)
    
    while response.writer.flush():
        response.writer.write(".")
        time.sleep(0.01)

    if key:
        stash_write(request, key, 'closed')
