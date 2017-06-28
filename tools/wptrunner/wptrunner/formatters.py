import json

from collections import OrderedDict
from mozlog.structured.formatters.base import BaseFormatter


class WptreportFormatter(BaseFormatter):
    """Formatter that produces results in the format that wpreport expects."""

    def __init__(self):
        self.raw_results = OrderedDict()

    def suite_end(self, data):
        results = OrderedDict()
        results["results"] = []
        for test_name in self.raw_results:
            result = {"test": test_name}
            result.update(self.raw_results[test_name])
            results["results"].append(result)
        return json.dumps(results)

    def test_start(self, data):
        self.start_times[data["test"]] = data["time"]

    def find_or_create_test(self, data):
        test_name = data["test"]
        if self.raw_results.get(test_name):
            return self.raw_results[test_name]

        test = {
            "subtests": [],
            "status": "",
            "message": None
        }
        self.raw_results[test_name] = test
        return test

    def find_or_create_subtest(self, data):
        test = self.find_or_create_test(data)
        subtest_name = data["subtest"]

        for i in range(len(test["subtests"])):
            if test["subtests"][i]["name"] == subtest_name:
                return test["subtests"][i]

        subtest = {
            "name": subtest_name,
            "status": "",
            "message": None
        }
        test["subtests"].append(subtest)

        return subtest

    def test_status(self, data):
        subtest = self.find_or_create_subtest(data)
        subtest["status"] = data["status"]
        if data.get("message"):
            if subtest["message"]:
                subtest["message"] += ", " + data["message"]
            else:
                subtest["message"] = data["message"]

    def test_end(self, data):
        test = self.find_or_create_test(data)
        test["status"] = data["status"]
