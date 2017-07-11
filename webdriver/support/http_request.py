import contextlib
import httplib
import json

class HTTPRequest(object):
    def __init__(self, host, port):
        self.host = host
        self.port = port

    def head(self, path):
        return self._request("HEAD", path)

    def get(self, path, use_json=False):
        return self._request("GET", path, use_json)

    @contextlib.contextmanager
    def _request(self, method, path, use_json=False):
        conn = httplib.HTTPConnection(self.host, self.port)
        try:
            conn.request(method, path)
            response = conn.getresponse()
            if use_json:
                parsed_obj = json.loads(response.read().decode('utf-8'))
                yield [response.status, parsed_obj]
            else:
                yield response
        finally:
            conn.close()
