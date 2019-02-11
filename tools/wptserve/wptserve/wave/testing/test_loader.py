from __future__ import absolute_import
import json
import os
import re

AUTOMATIC = u"automatic"
MANUAL = u"manual"

TEST_TYPES = [AUTOMATIC, MANUAL]

class TestLoader(object):
    def initialize(
        self,
        exclude_list_file_path,
        include_list_file_path,
        results_manager,
        api_titles
    ):
        self._exclude_list_file_path = exclude_list_file_path
        self._include_list_file_path = include_list_file_path
        self._results_manager = results_manager
        self._tests = {}
        self._tests[AUTOMATIC] = {}
        self._tests[MANUAL] = {}
        self._api_titles = api_titles

    def load_tests(self, manifest_file_path):
        manifest_file_handle = open(manifest_file_path)
        manifest_file = manifest_file_handle.read()
        manifest = json.loads(manifest_file)
        tests = manifest[u"items"]

        include_list = self._load_test_list(self._include_list_file_path)
        exclude_list = self._load_test_list(self._exclude_list_file_path)

        if u"testharness" in tests:
            self._tests[AUTOMATIC] = self._load_tests(
                tests=tests[u"testharness"],
                exclude_list=exclude_list
            )

        if u"manual" in tests:
            self._tests[MANUAL] = self._load_tests(
                tests=tests[u"manual"],
                include_list=include_list
            )

        for api in self._tests[AUTOMATIC]:
            for test_path in self._tests[AUTOMATIC][api][:]:
                if u"manual" not in test_path:
                    continue
                self._tests[AUTOMATIC][api].remove(test_path)

                if not self._is_valid_test(test_path, include_list=include_list):
                    continue

                if api not in self._tests[MANUAL]:
                    self._tests[MANUAL][api] = []
                self._tests[MANUAL][api].append(test_path)

    def _load_tests(self, tests, exclude_list=None, include_list=None):
        loaded_tests = {}
        for test in tests:
            test_path = tests[test][0][0]
            if not test_path.startswith("/"): test_path = "/" + test_path
            if self._is_valid_test(test_path, exclude_list, include_list):
                api_name = self._parse_api_name(test_path)
                if api_name not in loaded_tests:
                    loaded_tests[api_name] = []
                loaded_tests[api_name].append(test_path)
        return loaded_tests

    def _parse_api_name(self, test_path):
        for part in test_path.split(u"/"):
            if part == u"":
                continue
            return part

    def _is_valid_test(self, test_path, exclude_list=None, include_list=None):
        is_valid = True

        if include_list is not None and len(include_list) > 0:
            is_valid = False
            for include_test in include_list:
                pattern = re.compile(u"^" + include_test)
                if pattern.match(test_path) is not None:
                    is_valid = True
                    break

        if not is_valid:
            return is_valid

        if exclude_list is not None and len(exclude_list) > 0:
            is_valid = True
            for exclude_test in exclude_list:
                pattern = re.compile(u"^" + exclude_test)
                if pattern.match(test_path) is not None:
                    is_valid = False
                    break

        return is_valid

    def _load_test_list(self, file_path):
        tests = []
        if not os.path.isfile(file_path):
            return tests

        file_handle = open(file_path)
        file_content = file_handle.read()

        for line in file_content.split():
            line = line.replace(u" u", u"")
            line = re.sub(r"^#", u"", line)
            if line == u"":
                continue
            tests.append(line)

        return tests

    def get_tests(
        self,
        types=[AUTOMATIC, MANUAL],
        include_list=[],
        exclude_list=[],
        reference_tokens=[]
    ):
        loaded_tests = {}

        reference_results = self._results_manager.read_common_passed_tests(
            reference_tokens)

        for test_type in types:
            if test_type not in TEST_TYPES:
                continue
            for api in self._tests[test_type]:
                for test_path in self._tests[test_type][api]:
                    if not self._is_valid_test(test_path, exclude_list, include_list):
                        continue
                    if reference_results is not None and test_path not in reference_results[api]:
                        continue
                    if api not in loaded_tests:
                        loaded_tests[api] = []
                    loaded_tests[api].append(test_path)
        return loaded_tests

    def get_apis(self):
        apis = []
        for test_type in TEST_TYPES:
            for api in self._tests[test_type]:
                in_list = False
                for item in apis:
                    if item["path"] == "/" + api:
                        in_list = True
                        break
                if in_list: continue
                title = None
                for item in self._api_titles:
                    if item["path"] == "/" + api:
                        title = item["title"]
                        break

                if title is None:
                    apis.append({"title": api, "path": "/" + api})
                else:
                    apis.append({"title": title, "path": "/" + api})
        return apis
