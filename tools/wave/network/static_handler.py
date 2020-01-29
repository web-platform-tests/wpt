from __future__ import with_statement
from __future__ import absolute_import
import os
from io import open


class StaticHandler(object):
    def __init__(self, web_root, http_port, https_port):
        self.static_dir = os.path.join(
            os.getcwd(), u"tools/wave/www")
        self._web_root = web_root
        self._http_port = http_port
        self._https_port = https_port

    def handle_request(self, request, response):
        file_path = u"."

        for part in request.request_path.split(u"/")[2:]:
            file_path = file_path + u"/" + part

        if file_path == u"." or file_path == u"./":
            file_path = u"index.html"

        file_path = file_path.split(u"?")[0]
        file_path = os.path.join(self.static_dir, file_path)

        headers = []

        content_types = {
            u"html": u"text/html",
            u"js": u"text/javascript",
            u"css": u"text/css",
            u"jpg": u"image/jpeg",
            u"jpeg": u"image/jpeg",
            u"ttf": u"font/ttf",
            u"woff": u"font/woff",
            u"woff2": u"font/woff2"
        }

        headers.append(
            (u"Content-Type", content_types[file_path.split(u".")[-1]]))

        data = None
        with open(file_path, u"rb") as file:
            data = file.read()

        if file_path.split("/")[-1] == "wave-service.js":
            data = str(data)
            data = data.replace("{{WEB_ROOT}}", str(self._web_root))
            data = data.replace("{{HTTP_PORT}}", str(self._http_port))
            data = data.replace("{{HTTPS_PORT}}", str(self._https_port))

        response.content = data
        response.headers = headers
