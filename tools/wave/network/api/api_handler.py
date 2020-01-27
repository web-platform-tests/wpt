from __future__ import absolute_import
import json


class ApiHandler(object):
    def set_headers(self, response, headers):
        if not isinstance(response.headers, list):
            response.headers = []
        for header in headers:
            response.headers.append(header)

    def send_json(self, data, response, status=200):
        json_string = json.dumps(data, indent=4)
        response.content = json_string
        self.set_headers(response, [(u"Content-Type", u"application/json")])
        response.status = status

    def send_file(self, blob, file_name, response):
        self.set_headers(response, [("Content-Disposition", "attachment;filename=" + file_name)])
        response.content = blob

    def send_zip(self, data, file_name, response):
        response.headers = [("Content-Type", "application/x-compressed")]
        self.send_file(data, file_name, response)

    def parse_uri(self, request):
        uri_parts = []
        request_path = request.request_path
        if u"?" in request_path:
            request_path = request_path.split(u"?")[0]
        for part in request_path.split(u"/"):
            if part == u"":
                continue
            uri_parts.append(part)
        return uri_parts

    def parse_query_parameters(self, request):
        if u"?" not in request.request_path: return {}
        query = request.request_path.split(u"?")[1]
        if query == u"": return {}
        key_value_pairs = []
        if u"&" in query:
            key_value_pairs = query.split(u"&")
        else:
            key_value_pairs.append(query)

        parsed_parameters = {}
        for key_value_pair in key_value_pairs:
            if u"=" not in key_value_pair:
                parsed_parameters[key_value_pair] = True
                continue
            key, value = key_value_pair.split(u"=")
            parsed_parameters[key] = value

        return parsed_parameters


