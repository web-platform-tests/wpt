from wptserve.utils import isomorphic_decode

from six import PY3

def main(request, response):
    testinput = request.POST.first(b"testinput")
    if PY3:
        testinput.value = isomorphic_decode(testinput.value)
    return ([(b"Content-Type", b"text/html")], u"<script>parent.postMessage(\"" + str(testinput) + u"\", '*');</script>")
