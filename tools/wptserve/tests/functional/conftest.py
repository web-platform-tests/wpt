import pytest
import base64
import os
from six.moves.urllib.parse import urlencode, urlunsplit
from six.moves.urllib.request import Request as BaseRequest
from six.moves.urllib.request import urlopen
wptserve = pytest.importorskip("wptserve")

here = os.path.split(__file__)[0]
doc_root = os.path.join(here, "docroot")

HOST = "localhost"
PORT = 0


class Request(BaseRequest):
    def __init__(self, *args, **kwargs):
        BaseRequest.__init__(self, *args, **kwargs)
        self.method = "GET"

    def get_method(self):
        return self.method

    def add_data(self, data):
        if hasattr(data, "iteritems"):
            data = urlencode(data)
        self.add_header("Content-Length", str(len(data)))
        BaseRequest.add_data(self, data)


@pytest.fixture
def server(request):
    global HOST, PORT
    server = wptserve.server.WebTestHttpd(host=HOST,
                                          port=PORT,
                                          use_ssl=False,
                                          certificate=None,
                                          doc_root=doc_root)
    HOST = server.host
    PORT = server.port
    server.start(False)

    def host():
        return server.host

    yield server
    server.stop()


def abs_url(path, query=None):
    return urlunsplit(("http", "%s:%i" % (HOST, PORT), path, query, None))


@pytest.fixture
def request():
    def _request(path, query=None, method="GET", headers=None, body=None, auth=None):
        req = Request(abs_url(path, query))
        req.method = method
        if headers is None:
            headers = {}

        for name, value in headers.iteritems():
            req.add_header(name, value)

        if body is not None:
            req.add_data(body)

        if auth is not None:
            req.add_header("Authorization", "Basic %s" % base64.b64encode('%s:%s' % auth))

        return urlopen(req)
    return _request
