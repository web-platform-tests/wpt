from __future__ import absolute_import
import re

import os
import json

from tinydb import TinyDB, Query

from ..data.session import COMPLETED, ABORTED
from ..utils.serializer import serialize_session
from ..utils.deserializer import deserialize_session, deserialize_sessions

DB_ROOT_PATH = 'exports'
DB_FILE_NAME = 'db-sessions.json'

class SessionsDatabase(object):
    def initialize(self, results_database, tests_database):
        self._results_database = results_database
        self._tests_database = tests_database
        
        script_path = os.path.realpath(__file__)
        target_dir = os.path.join(os.path.dirname(script_path), DB_ROOT_PATH)

        # check target_dir existence
        if not os.path.isdir(target_dir):
            try:
                os.mkdir(target_dir)
            except OSError as oerr:
                print("{} >> already exists ".format(target_dir), oerr)

        self._db_path = os.path.join('.', DB_ROOT_PATH, DB_FILE_NAME)
        abs_db_dir = os.path.dirname(os.path.realpath(__file__))
        self.abs_db_path = os.path.join(abs_db_dir, self._db_path)

        # check DB_FILE_NAME existence
        if not os.path.isfile(self.abs_db_path):
            try:
                f = open(self.abs_db_path, "w")
                f.write("{}")
                f.close()
            except OSError as oerr:
                print("{} >> already exists ".format(self.abs_db_path), oerr)

        self._sessions_db = TinyDB(self.abs_db_path).table('session', cache_size=None)
        self.Session = Query();


    def create_session(self, session):
        # convert unicode token to string
        token = session.token
        session_dict = serialize_session(session)

        tests = {}
        if session.status != COMPLETED and session.status != ABORTED:
            tests[u"pending_tests"] = session.pending_tests
            tests[u"running_tests"] = session.running_tests
            tests[u"completed_tests"] = session.completed_tests

        tests[u"malfunctioning_tests"] = session.malfunctioning_tests

        self._tests_database.create_tests(token, tests)

        del session_dict[u"completed_tests"]
        del session_dict[u"running_tests"]
        del session_dict[u"pending_tests"]
        del session_dict[u"malfunctioning_tests"]

        self._sessions_db.insert(session_dict)

    def read_session(self, token):
        session_dict = None
        # use: self._sessions_db.search(condition) to get multiple results
        # self._sessions_db.get(condition) return the first entity matches
        session_dict = self._sessions_db.get(
            self.Session.token == token
        )

        if session_dict is None: return None

        session = deserialize_session(session_dict)        
        tests = self._tests_database.read_tests(token)

        if tests is not None:
            if session.status != COMPLETED and session.status != ABORTED:
                if u"pending_tests" in tests: session.pending_tests = tests[u"pending_tests"]
                if u"completed_tests" in tests: session.completed_tests = tests[u"completed_tests"]
                if u"running_tests" in tests: session.running_tests = tests[u"running_tests"]
            if u"malfunctioning_tests" in tests: session.malfunctioning_tests = tests[u"malfunctioning_tests"]

        return session

    def read_sessions(self):
        with open(self.abs_db_path) as json_file:
            return deserialize_sessions(json.load(json_file))

    def read_expiring_sessions(self):
        # return all session where expiration_date is not None / exists
        expiring_sessions = self._sessions_db.search(
            ~(self.Session.expiration_date == None)
        )
        expiring_sessions = deserialize_sessions(expiring_sessions)
        return expiring_sessions

    def read_public_sessions(self):
        # return all session where is_public is not None / exists
        public_sessions = self._sessions_db.search(
            ~(self.Session.is_public == None)
        )
        public_sessions = deserialize_sessions(public_sessions)
        return public_sessions

    def update_session(self, session):
        token = session.token
        if self.read_session(token) is None: return
        session_dict = serialize_session(session)

        tests = {}
        if session.status != COMPLETED and session.status != ABORTED:
            tests[u"pending_tests"] = session.pending_tests
            tests[u"running_tests"] = session.running_tests
            tests[u"completed_tests"] = session.completed_tests

        tests[u"malfunctioning_tests"] = session.malfunctioning_tests
        self._tests_database.update_tests(token, tests)

        del session_dict[u"completed_tests"]
        del session_dict[u"running_tests"]
        del session_dict[u"pending_tests"]
        del session_dict[u"malfunctioning_tests"]

        self._sessions_db.update(session_dict, self.Session.token == token)

    def delete_session(self, token):
        self._sessions_db.remove(self.Session.token == token)
        self._tests_database.delete_tests(token)
        self._results_database.delete_results(token)

    def find_tokens(self, fragment):
        tokens = self._sessions_db.search(
            self.Session.token.matches(u"^"+fragment)
        )
        # pattern = re.compile(u"^" + fragment)
        # # loop through all session where token is not None / exists
        # for key in self._sessions_db.search(~(self.Session.token == None)):
        #     if pattern.match(key) is not None:
        #         tokens.append(keys)
        return tokens

