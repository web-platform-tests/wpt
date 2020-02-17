from __future__ import absolute_import
import json
import sys
import traceback

from .api_handler import ApiHandler
from ...data.exceptions.duplicate_exception import DuplicateException
from ...data.exceptions.invalid_data_exception import InvalidDataException


class ResultsApiHandler(ApiHandler):
    def __init__(self, results_manager):
        self._results_manager = results_manager

    def create_result(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            data = None
            body = request.body.decode(u"utf-8")
            if body != u"":
                data = json.loads(body)

            self._results_manager.create_result(token, data)

        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to create result: " + info[0].__name__ + u": " +
                str(info[1].args[0]))
            response.status = 500

    def read_results(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            results = self._results_manager.read_results(token)

            self.send_json(response=response, data=results)

        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read results: " + info[0].__name__ + u": " +
                info[1].args[0])
            response.status = 500

    def read_results_compact(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            results = self._results_manager.read_flattened_results(token)

            self.send_json(response=response, data=results)

        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read compact results: " + info[0].__name__ +
                u": " + info[1].args[0])
            response.status = 500

    def read_results_config(self, request, response):
        try:
            import_enabled = self._results_manager.is_import_enabled()
            reports_enabled = self._results_manager.are_reports_enabled()

            self.send_json({
                "import_enabled": import_enabled,
                "reports_enabled": reports_enabled
            }, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read results configuration: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def read_results_api_wpt_report_url(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            api = uri_parts[4]

            uri = self._results_manager.read_results_wpt_report_uri(token, api)
            self.send_json({"uri": uri}, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read results report url: " + info[0].__name__ +
                u": " + info[1].args[0])
            response.status = 500

    def read_results_api_wpt_multi_report_uri(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            api = uri_parts[3]
            query = self.parse_query_parameters(request)
            tokens = query["tokens"].split(",")
            uri = self._results_manager.read_results_wpt_multi_report_uri(
                tokens,
                api
            )
            self.send_json({"uri": uri}, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read results multi report url: " +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500

    def download_results_api_json(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            api = uri_parts[4]
            blob = self._results_manager.export_results_api_json(token, api)
            if blob is None:
                response.status = 404
                return
            file_path = self._results_manager.get_json_path(token, api)
            file_name = "{}-{}-{}".format(
                token.split("-")[0],
                api,
                file_path.split("/")[-1]
            )
            self.send_zip(blob, file_name, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to download api json: " +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500

    def download_results_all_api_jsons(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            blob = self._results_manager.export_results_all_api_jsons(token)
            file_name = token.split("-")[0] + "_results_json.zip"
            self.send_zip(blob, file_name, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to download all api jsons: " +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500

    def download_results(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            blob = self._results_manager.export_results(token)
            if blob is None:
                response.status = 404
                return
            file_name = token + ".zip"
            self.send_zip(blob, file_name, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to export results: " +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500

    def download_results_overview(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            blob = self._results_manager.export_results_overview(token)
            if blob is None:
                response.status = 404
                return
            file_name = token.split("-")[0] + "_results_html.zip"
            self.send_zip(blob, file_name, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to download results overview:" +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500

    def import_results(self, request, response):
        try:
            blob = request.body
            token = self._results_manager.import_results(blob)
            self.send_json({"token": token}, response)
        except DuplicateException:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            self.send_json({"error": str(info[1].args[0])}, response, 400)
            return
        except InvalidDataException:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            self.send_json({"error": str(info[1].args[0])}, response, 400)
            return
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to import results: " +
                info[0].__name__ + u": " + str(info[1].args[0]))
            response.status = 500

    def handle_request(self, request, response):
        method = request.method
        uri_parts = self.parse_uri(request)
        uri_parts = uri_parts[3:]

        # /api/results/<token>
        if len(uri_parts) == 1:
            if method == u"POST":
                if uri_parts[0] == "import":
                    self.import_results(request, response)
                    return
                self.create_result(request, response)
                return

            if method == u"GET":
                if uri_parts[0] == u"config":
                    self.read_results_config(request, response)
                    return
                else:
                    self.read_results(request, response)
                    return

        # /api/results/<token>/<function>
        if len(uri_parts) == 2:
            function = uri_parts[1]
            if method == u"GET":
                if function == u"compact":
                    self.read_results_compact(request, response)
                    return
                if function == u"reporturl":
                    return self.read_results_api_wpt_multi_report_uri(request,
                                                                      response)
                if function == u"json":
                    self.download_results_all_api_jsons(request, response)
                    return
                if function == u"export":
                    self.download_results(request, response)
                    return
                if function == "overview":
                    self.download_results_overview(request, response)
                    return

        # /api/results/<token>/<api>/<function>
        if len(uri_parts) == 3:
            function = uri_parts[2]
            if method == u"GET":
                if function == u"reporturl":
                    self.read_results_api_wpt_report_url(request, response)
                    return
                if function == u"json":
                    self.download_results_api_json(request, response)
                    return

        response.status = 404
