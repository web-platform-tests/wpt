"""Dispatches requests to remote WebDriver endpoint."""

import exceptions

import httplib
import json
import urlparse
import webelement

class CommandExecutor:
    """Dispatches requests to remote WebDriver endpoint."""

    _HEADERS = {
        "User-Agent": "Python WebDriver Local End",
        "Content-Type": "application/json;charset=\"UTF-8\"",
        "Accept": "application/json"
        }

    def __init__(self, url, mode='strict'):
        self._parsed_url = urlparse.urlparse(url)
        self._conn = httplib.HTTPConnection(self._parsed_url.hostname,
                                            self._parsed_url.port)
        self._mode = mode

    def execute(self,
                method,
                path,
                session_id,
                name,
                parameters=None,
                object_hook=None):
        """Execute a command against the WebDriver endpoint."""
        if self._mode == 'strict':
            return self._execute_strict(
                method, path, session_id, name, parameters, object_hook)
        elif self._mode == 'compatibility':
            return self._execute_compatibility(
                method, path, session_id, name, parameters, object_hook)
        else:
            raise Exception("Unknown mode: " + self._mode)

    def _execute_compatibility(self,
                               method,
                               path,
                               session_id,
                               name,
                               parameters,
                               object_hook):
        body = {'sessionId': session_id, 'name': name }
        if parameters:
            body.update(parameters)
        self._conn.request(
            method,
            self._parsed_url.path + path,
            json.dumps(parameters, default = self._json_encode).encode('utf-8'))
        resp = self._conn.getresponse()
        data = resp.read().decode('utf-8')
        if data:
            data = json.loads(data, object_hook = object_hook)
            if data['status'] != 0:
                raise exceptions.create_webdriver_exception_compatibility(
                    data['status'], data['value']['message'])
            return data
        if resp.status < 200 or resp.status > 299:
            raise exceptions.create_webdriver_exception_compatibility(
                resp.status, resp.reason)

    def _execute_strict(self,
                        method,
                        path,
                        session_id,
                        name,
                        parameters,
                        object_hook):
        body = {
            'sessionId': session_id,
            'name': name,
            'parameters': parameters }
        self._conn.request(
            method,
            self._parsed_url.path + path,
            json.dumps(body, default = self._json_encode).encode('utf-8'))
        resp = self._conn.getresponse()
        data = json.loads(
            resp.read().decode('utf-8'), object_hook = object_hook)
        if data['status'] != 'success':
            raise exceptions.create_webdriver_exception_strict(
                data['status'], data['value'])
        return data

    def _json_encode(self, obj):
        return obj.to_json()
