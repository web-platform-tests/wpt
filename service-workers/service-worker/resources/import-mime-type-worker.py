from wptserve.utils import isomorphic_decode

def main(request, response):
    if b'mime' in request.GET:
        return (
            [(b'Content-Type', b'application/javascript')],
            u"importScripts('./mime-type-worker.py?mime={0}');".format(isomorphic_decode(request.GET[b'mime']))
        )
    return (
        [(b'Content-Type', b'application/javascript')],
        u"importScripts('./mime-type-worker.py');"
    )
