import httplib
import sys
import traceback


class HttpHandler(object):
    def __init__(
        self,
        static_handler=None,
        sessions_api_handler=None,
        tests_api_handler=None,
        results_api_handler=None,
        http_port=None
    ):
        self.static_handler = static_handler
        self.sessions_api_handler = sessions_api_handler
        self.tests_api_handler = tests_api_handler
        self.results_api_handler = results_api_handler
        self._http_port = http_port

    def handle_request(self, request, response):
        response.headers = [
            ("Access-Control-Allow-Origin", "*"),
            ("Access-Control-Allow-Headers", "*"),
            ("Access-Control-Allow-Methods", "*")
        ]
        if request.method == "OPTIONS":
            return

        is_api_call = False

        for index, part in enumerate(request.request_path.split(u"/")):
            if index > 2:
                break
            if part == u"" or part is None or index != 2:
                continue
            if part != u"api":
                continue

            is_api_call = True

        if (is_api_call):
            if request.url_parts.scheme == "https":
                self._proxy(request, response)
                return
            self.handle_api(request, response)
        else:
            self.handle_static_file(request, response)

    def handle_api(self, request, response):
        api_name = None

        for index, part in enumerate(request.request_path.split(u"/")):
            if index > 3:
                break
            if part == u"" or part is None or index != 3:
                continue
            api_name = part.replace("?", "")

        if api_name is None:
            return

        if api_name == u"sessions":
            self.sessions_api_handler.handle_request(request, response)
            return
        if api_name == u"tests":
            self.tests_api_handler.handle_request(request, response)
            return
        if api_name == u"results":
            self.results_api_handler.handle_request(request, response)
            return

    def handle_static_file(self, request, response):
        self.static_handler.handle_request(request, response)

    def _proxy(self, request, response):
        host = 'localhost'
        port = str(self._http_port)
        uri = request.url_parts.path
        uri = uri + "?" + request.url_parts.query
        data = request.raw_input.read(request.headers.get('Content-Length'))
        method = request.method

        try:
            proxy_connection = httplib.HTTPConnection(host, port)
            proxy_connection.request(method, uri, data, request.headers)
            proxy_response = proxy_connection.getresponse()
            response.content = proxy_response.read()
            response.headers = proxy_response.getheaders()
            response.status = proxy_response.status

        except IOError:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to perform proxy request: " +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500
