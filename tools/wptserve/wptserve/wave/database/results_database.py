
from __future__ import absolute_import

import os
from tinydb import TinyDB, Query

DB_ROOT_PATH = 'exports/'
DB_FILE_NAME = 'db-results.json'

class ResultsDatabase(object):
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
                print("{} >> already exists ".format(self.abs_db_path), oerr)

        self._results_db = TinyDB(self.abs_db_path).table('results', cache_size=None)
        self.Result = Query();

    def create_result(self, token, result):
        return self._results_db.insert({"token": token, "result": result})

    def read_results(self, token):
        elements = self._results_db.search(self.Result.token == token)
        return map(lambda x: x[u"result"], elements) 

    def delete_results(self, token):
        return self._results_db.remove(self.Result.token == token)
