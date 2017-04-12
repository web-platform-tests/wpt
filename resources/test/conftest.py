import io
import json
import os

import html5lib
import pytest
from selenium import webdriver

from wptserver import WPTServer

_ENC = 'utf8'
_HERE = os.path.dirname(os.path.abspath(__file__))
_WPT_ROOT = os.path.normpath(os.path.join(_HERE, '..', '..'))
_HARNESS = os.path.join(_HERE, 'harness.html')

def pytest_collect_file(path, parent):
    if path.ext.lower() == '.html':
        return HTMLItem(str(path), parent)

def pytest_configure(config):
    config.driver = webdriver.Firefox()
    config.server = WPTServer(_WPT_ROOT)
    config.server.start()
    config.add_cleanup(lambda: config.server.stop())
    config.add_cleanup(lambda: config.driver.quit())

class HTMLItem(pytest.Item, pytest.Collector):
    def __init__(self, filename, parent):
        self.filename = filename
        with io.open(filename, encoding=_ENC) as f:
            markup = f.read()

        parsed = html5lib.parse(markup, namespaceHTMLElements=False)
        name = None
        self.expected = None

        for element in parsed.getiterator():
            if not name and element.tag == 'title':
                name = element.text
                continue
            if element.attrib.get('id') == 'expected':
                self.expected = element.text
                continue

        super(HTMLItem, self).__init__(name, parent)


    def reportinfo(self):
        return self.fspath, None, self.filename

    def repr_failure(self, excinfo):
        return pytest.Collector.repr_failure(self, excinfo)

    def runtest(self):
        driver = self.session.config.driver
        server = self.session.config.server

        driver.get(server.url(_HARNESS))

        if self.expected is None:
            raise Exception('Expected value not declared')

        expected = json.loads(unicode(self.expected))

        actual = driver.execute_async_script('runTest("%s", "foo", arguments[0])' % server.url(str(self.filename)))

        # Test object ordering is not guaranteed. This weak assertion verifies
        # that the indices are unique and sequential
        indices = map(lambda test_obj: test_obj.get('index'), actual["tests"])
        self._assert_sequence(indices)

        # Stack traces are implementation-defined
        actual['status'] = self._scrub_stack(actual['status'])
        actual['tests'] = map(self._scrub_stack, actual['tests'])
        actual['tests'] = map(self._scrub_index, actual['tests'])
        actual['tests'].sort(key=lambda test_obj: test_obj.get('name'))

        assert actual == expected

    @staticmethod
    def _assert_sequence(nums):
        assert nums == range(1, nums[-1] + 1)

    @staticmethod
    def _scrub_index(test_obj):
        copy = dict(test_obj)

        assert isinstance(copy.get('index'), int)

        copy['index'] = u'(non-deterministic)'

        return copy

    @staticmethod
    def _scrub_stack(test_obj):
        copy = dict(test_obj)

        assert 'stack' in copy

        if copy['stack'] is not None:
            copy['stack'] = u'(implementation-defined)'

        return copy
