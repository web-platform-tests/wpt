
from __future__ import absolute_import
import os

from tinydb import TinyDB, Query

DB_ROOT_PATH = 'exports/'
DB_FILE_NAME = 'db-tests.json'

class TestsDatabase(object):
    def initialize(self):
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
                print("{} >> already exists ".format(target_dir), oerr)

        self._tests_db = TinyDB(self.abs_db_path).table('tests', cache_size=None)
        self.Test = Query();

    def create_tests(self, token, tests):
        self._tests_db.insert({"token": token, "tests": tests})

    def read_tests(self, token):
        return self._tests_db.search(self.Test.token == token)

    def update_tests(self, token, tests):
        self._tests_db.update(self.Test.token == token)

    def delete_tests(self, token):
        tests = self._tests_db.remove(self.Test.token == token)
        return self.__remove_touch(tests)
    