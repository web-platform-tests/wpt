from __future__ import absolute_import
import json
import sys
import traceback

from .api_handler import ApiHandler
from ...utils.serializer import serialize_session
from ...data.session import PAUSED, COMPLETED, ABORTED, PENDING, RUNNING

DEFAULT_LAST_COMPLETED_TESTS_COUNT = 5
DEFAULT_LAST_COMPLETED_TESTS_STATUS = [u"ALL"]

class TestsApiHandler(ApiHandler):
    def __init__(
        self, 
        wpt_port, 
        wpt_ssl_port, 
        tests_manager, 
        sessions_manager,
        hostname,
        web_root,
        test_loader
    ):
        self._tests_manager = tests_manager
        self._sessions_manager = sessions_manager
        self._wpt_port = wpt_port
        self._wpt_ssl_port = wpt_ssl_port
        self._hostname = hostname
        self._web_root = web_root
        self._test_loader = test_loader

    def read_tests(self, response):
        tests = self._tests_manager.read_tests()
        self.send_json(tests, response)

    def read_session_tests(self, request, response):
        uri_parts = self.parse_uri(request)
        token = uri_parts[3]
        session = self._sessions_manager.read_session(token)

        if session is None:
            response.status = 404
            return
        
        data = serialize_session(session)
        tests = {
            u"token": token,
            u"pending_tests": data[u"pending_tests"],
            u"running_tests": data[u"running_tests"]
        }
        self.send_json(tests, response)

    
    def read_next_test(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            hostname = self._hostname

            session = self._sessions_manager.read_session(token)
            if session is None:
                response.status = 404
                return

            if session.status == PAUSED:
                url = self._generate_wave_url(
                    hostname=hostname,
                    uri=u"/wave/pause.html",
                    token=token
                )
                self.send_json({u"next_test": url}, response)
                return
            if session.status == COMPLETED or session.status == ABORTED:
                url = self._generate_wave_url(
                    hostname=hostname,
                    uri=u"/wave/finish.html",
                    token=token
                )
                self.send_json({u"next_test": url}, response)
                return
            if session.status == PENDING:
                url = self._generate_wave_url(
                    hostname=hostname,
                    uri=u"/wave/newsession.html",
                    token=token
                )
                self.send_json({u"next_test": url}, response)
                return
            
            test = self._tests_manager.next_test(session)

            if test is None:
                if session.status != RUNNING: return
                url = self._generate_wave_url(
                    hostname=hostname,
                    uri=u"/wave/finish.html",
                    token=token
                )
                self.send_json({u"next_test": url}, response)
                self._sessions_manager.complete_session(token)
                return

            test_timeout = self._tests_manager.get_test_timeout(test=test, session=session)
            url = self._generate_test_url(
                test=test,
                token=token,
                test_timeout=test_timeout,
                hostname=hostname
            )

            self.send_json({
                u"next_test": url
            }, response)
        except Exception as e:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print u"Failed to read next test: " + info[0].__name__ + u": " + info[1].args[0]
            response.status = 500

    def read_last_completed(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            query = self.parse_query_parameters(request)
            count = None
            if u"count" in query: 
                count = query[u"count"]
            else:
                count = DEFAULT_LAST_COMPLETED_TESTS_COUNT

            status = None
            if u"status" in query:
                status = query[u"status"].split(",")
            else:
                status = DEFAULT_LAST_COMPLETED_TESTS_STATUS

            completed_tests = self._tests_manager.read_last_completed_tests(token, count)
            tests = {}
            for one_status in status:
                one_status = one_status.lower()
                if one_status == u"pass":
                    tests[u"pass"] = completed_tests[u"pass"]
                    continue
                if one_status == u"fail":
                    tests[u"fail"] = completed_tests[u"fail"]
                    continue
                if one_status == u"timeout":
                    tests[u"timeout"] = completed_tests[u"timeout"]
                    continue
                if one_status == u"all":
                    tests[u"pass"] = completed_tests[u"pass"]
                    tests[u"fail"] = completed_tests[u"fail"]
                    tests[u"timeout"] = completed_tests[u"timeout"]
                    break
            self.send_json(data=tests, response=response)
        except Exception as e:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print u"Failed to read last completed tests: " + info[0].__name__ + u": " + unicode(info[1].args[0])
            response.status = 500

    def read_malfunctioning(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]
            
            malfunctioning_tests = self._tests_manager.read_malfunctioning_tests(token)

            self.send_json(data=malfunctioning_tests, response=response)
        except Exception as e:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print u"Failed to read malfunctioning tests: " + info[0].__name__ + u": " + info[1].args[0]
            response.status = 500

    def update_malfunctioning(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            data = None
            body = request.body.decode(u"utf-8")
            if body != u"":
                data = json.loads(body)
            
            self._tests_manager.update_malfunctioning_tests(token, data)
        except Exception as e:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print u"Failed to read malfunctioning tests: " + info[0].__name__ + u": " + info[1].args[0]
            response.status = 500

    def read_available_apis(self, request, response):
        try:
            apis = self._test_loader.get_apis()
            self.send_json(apis, response)
        except Exception as e:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print u"Failed to read malfunctioning tests: " + info[0].__name__ + u": " + info[1].args[0]
            response.status = 500


    def handle_request(self, request, response):
        method = request.method
        uri_parts = self.parse_uri(request)
        uri_parts = uri_parts[3:]

        # /api/tests
        if len(uri_parts) == 0:         
            if method == u"GET":
                self.read_tests(response)
                return

        # /api/tests/<token>
        if len(uri_parts) == 1:         
            if method == u"GET":
                if uri_parts[0] == "apis":
                    self.read_available_apis(request, response)
                    return
                self.read_session_tests(request, response)
                return

        # /api/tests/<token>/<function>
        if len(uri_parts) == 2:
            function = uri_parts[1]
            if method == u"GET":
                if function == u"next":
                    self.read_next_test(request, response)
                    return
                if function == u"last_completed":
                    self.read_last_completed(request, response)
                    return
                if function == u"malfunctioning":
                    self.read_malfunctioning(request, response)
                    return
            if method == u"PUT":
                if function == u"malfunctioning":
                    self.update_malfunctioning(request, response)
                    return


        response.status = 404

    def _generate_wave_url(self, hostname, uri, token):
        return self._generate_url(
            hostname=hostname,
            uri=uri,
            port=self._wpt_port,
            query=u"?token=" + token
        )

    def _generate_test_url(self, hostname, test, token, test_timeout):
        protocol = u"http"
        port = self._wpt_port

        if u"https" in test:
            protocol = u"https"
            port = self._wpt_ssl_port

        query = u"?token={}&timeout={}&https_port={}&web_root={}".format(
                token,
                test_timeout,
                self._wpt_ssl_port,
                self._web_root
        )

        return self._generate_url(
            protocol=protocol,
            hostname=hostname,
            port=port,
            uri=test,
            query=query
        )

    def _generate_url(self, hostname, port=80, uri=u"/", query=u"", protocol=u"http"):
        if not uri.startswith(u"/"): uri = u"/" + uri
        return u"{}://{}:{}{}{}".format(protocol, hostname, port, uri, query)
