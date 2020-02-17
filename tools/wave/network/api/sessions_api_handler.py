from __future__ import absolute_import
import json
import sys
import traceback
import threading

from .api_handler import ApiHandler

from ...utils.serializer import serialize_session
from ...data.exceptions.not_found_exception import NotFoundException
from ...data.exceptions.invalid_data_exception import InvalidDataException
from ...data.http_polling_client import HttpPollingClient

TOKEN_LENGTH = 36


class SessionsApiHandler(ApiHandler):
    def __init__(self, sessions_manager, results_manager, event_dispatcher):
        self._sessions_manager = sessions_manager
        self._results_manager = results_manager
        self._event_dispatcher = event_dispatcher

    def create_session(self, request, response):
        try:
            config = {}
            body = request.body.decode(u"utf-8")
            if body != u"":
                config = json.loads(body)
            tests = {}
            if u"tests" in config:
                tests = config[u"tests"]
            types = None
            if u"types" in config:
                types = config[u"types"]
            timeouts = {}
            if u"timeouts" in config:
                timeouts = config[u"timeouts"]
            reference_tokens = []
            if u"reference_tokens" in config:
                reference_tokens = config[u"reference_tokens"]
            webhook_urls = []
            if u"webhook_urls" in config:
                webhook_urls = config[u"webhook_urls"]
            user_agent = request.headers[b"user-agent"].decode(u"utf-8")
            labels = []
            if u"labels" in config:
                labels = config[u"labels"]
            expiration_date = None
            if u"expiration_date" in config:
                expiration_date = config[u"expiration_date"]

            session = self._sessions_manager.create_session(
                tests,
                types,
                timeouts,
                reference_tokens,
                webhook_urls,
                user_agent,
                labels,
                expiration_date
            )

            self.send_json({u"token": session.token}, response)
        except InvalidDataException:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to create session: " + info[0].__name__ + u": " +
                info[1].args[0])
            self.send_json({u"error": info[1].args[0]}, response, 400)

        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to create session: " + info[0].__name__ + u": " +
                info[1].args[0])
            response.status = 500

    def read_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            # convert unicode to ascii to get a str type, ignore special chars
            token = uri_parts[3]

            session = self._sessions_manager.read_session(token)
            if session is None:
                response.status = 404
                return

            data = serialize_session(session)

            del data[u"pending_tests"]
            del data[u"running_tests"]
            del data[u"malfunctioning_tests"]
            del data[u"test_state"]
            del data[u"date_started"]
            del data[u"date_finished"]
            del data[u"status"]

            self.send_json(data, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def read_session_status(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            # convert unicode to ascii to get a str type, ignore special chars
            token = uri_parts[3]

            session = self._sessions_manager.read_session_status(token)
            if session is None:
                response.status = 404
                return
            data = serialize_session(session)

            del data[u"tests"]
            del data[u"pending_tests"]
            del data[u"running_tests"]
            del data[u"malfunctioning_tests"]
            del data[u"types"]
            del data[u"test_state"]
            del data[u"last_completed_test"]
            del data[u"user_agent"]
            del data[u"timeouts"]
            del data[u"browser"]
            del data[u"is_public"]
            del data[u"reference_tokens"]
            del data[u"webhook_urls"]

            self.send_json(data, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read session status: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def read_public_sessions(self, request, response):
        try:
            session_tokens = self._sessions_manager.read_public_sessions()

            self.send_json(session_tokens, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to read public session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def update_session_configuration(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            # convert unicode to ascii to get a str type, ignore special chars
            token = uri_parts[3]

            config = {}
            body = request.body.decode(u"utf-8")
            if body != u"":
                config = json.loads(body)

            tests = {}
            if u"tests" in config:
                tests = config[u"tests"]
            types = None
            if u"types" in config:
                types = config[u"types"]
            timeouts = {}
            if u"timeouts" in config:
                timeouts = config[u"timeouts"]
            reference_tokens = []
            if u"reference_tokens" in config:
                reference_tokens = config[u"reference_tokens"]
            webhook_urls = []
            if u"webhook_urls" in config:
                webhook_urls = config[u"webhook_urls"]

            self._sessions_manager.update_session_configuration(
                token,
                tests,
                types,
                timeouts,
                reference_tokens,
                webhook_urls
            )
        except NotFoundException as e:
            print(u"Failed to update session: " + e.args[0])
            response.status = 404
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to update session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def update_labels(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            # convert unicode to ascii to get a str type, ignore special chars
            token = uri_parts[3]
            body = request.body.decode(u"utf-8")
            labels = None
            if body != u"":
                labels = json.loads(body)
                if u"labels" in labels:
                    labels = labels[u"labels"]

            self._sessions_manager.update_labels(token=token, labels=labels)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to update labels: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def delete_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            session = self._sessions_manager.read_session(token)
            if session is None:
                response.status = 404
                return

            self._sessions_manager.delete_session(token)
            self._results_manager.delete_results(token)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to delete session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def start_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            self._sessions_manager.start_session(token)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to start session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def pause_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            self._sessions_manager.pause_session(token)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to pause session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def stop_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            self._sessions_manager.stop_session(token)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to stop session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def resume_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            resume_token = None
            body = request.body.decode(u"utf-8")
            if body != u"":
                resume_token = json.loads(body)[u"resume_token"]

            self._sessions_manager.resume_session(token, resume_token)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to stop session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def find_session(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            fragment = uri_parts[3]
            token = self._sessions_manager.find_token(fragment)
            if token is None:
                response.status = 404
                return
            self.send_json({"token": token}, response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to find session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def register_event_listener(self, request, response):
        try:
            uri_parts = self.parse_uri(request)
            token = uri_parts[3]

            event = threading.Event()
            http_polling_client = HttpPollingClient(token, event)
            self._event_dispatcher.add_session_client(http_polling_client)

            event.wait()

            message = http_polling_client.message
            self.send_json(data=message, response=response)
        except Exception:
            info = sys.exc_info()
            traceback.print_tb(info[2])
            print(u"Failed to find session: " +
                info[0].__name__ + u": " + info[1].args[0])
            response.status = 500

    def handle_request(self, request, response):
        method = request.method
        uri_parts = self.parse_uri(request)
        uri_parts = uri_parts[3:]

        # /api/sessions
        if len(uri_parts) == 0:
            if method == u"POST":
                self.create_session(request, response)
                return

        # /api/sessions/<token>
        if len(uri_parts) == 1:
            function = uri_parts[0]
            if method == u"GET":
                if function == u"public":
                    self.read_public_sessions(request, response)
                    return
                if len(function) != TOKEN_LENGTH:
                    self.find_session(request, response)
                    return
                self.read_session(request, response)
                return
            if method == u"PUT":
                self.update_session_configuration(request, response)
                return
            if method == u"DELETE":
                self.delete_session(request, response)
                return

        # /api/sessions/<token>/<function>
        if len(uri_parts) == 2:
            function = uri_parts[1]
            if method == u"GET":
                if function == u"status":
                    self.read_session_status(request, response)
                    return
                if function == u"events":
                    self.register_event_listener(request, response)
                    return
            if method == u"POST":
                if function == u"start":
                    self.start_session(request, response)
                    return
                if function == u"pause":
                    self.pause_session(request, response)
                    return
                if function == u"stop":
                    self.stop_session(request, response)
                    return
                if function == u"resume":
                    self.resume_session(request, response)
                    return
            if method == u"PUT":
                if function == u"labels":
                    self.update_labels(request, response)
                    return

        response.status = 404
