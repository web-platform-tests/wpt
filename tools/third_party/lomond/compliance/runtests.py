from __future__ import print_function
from __future__ import unicode_literals

import json
import logging
import sys

from six.moves.urllib_parse import urlencode

from lomond import WebSocket
from lomond.constants import USER_AGENT


logging.basicConfig()
logging.getLogger('lomond').setLevel(logging.INFO)


server = 'ws://127.0.0.1:9001'


log = logging.getLogger('wstests')


def get_test_count():
    """Gets the number of test cases."""
    ws = WebSocket(server + '/getCaseCount')
    case_count = None
    for event in ws:
        print(event)
        if event.name == 'text':
            case_count = json.loads(event.text)
    if case_count is None:
        print('Could not get case count. Is the test server running?')
        sys.exit(-1)
    return case_count


def run_tests():
    """Run all test cases."""
    test_count = get_test_count()
    print("Will run {} cases...".format(test_count))

    for test_no in range(1, test_count + 1):
        print("[{} of {}]".format(test_no, test_count))
        run_test(test_no)
    update_report()


def run_ws(url):
    """Run a websocket until close."""
    ws = WebSocket(url, compress=True)
    for event in ws.connect(ping_rate=0):
        try:
            if event.name == 'text':
                ws.send_text(event.text, compress=True)
            elif event.name == 'binary':
                ws.send_binary(event.data, compress=True)
        except Exception:
            log.exception('error running websocket')
            break


def run_test(test_no):
    """Run a test from its index."""
    qs = urlencode({'case': test_no, 'agent': USER_AGENT})
    url = server + '/runCase?{}'.format(qs)
    run_ws(url)


def run_test_cases(case_tuples):
    """Run a number of test cases from their 'case tuple'"""
    for case_tuple in case_tuples:
        qs = urlencode({'agent': USER_AGENT, 'case': case_tuple})
        url = server + '/runCase?{}'.format(qs)
        run_ws(url)
    update_report()


def update_report():
    """Tell wstest to update reports."""
    print("Updating reports...")
    qs = urlencode({'agent': USER_AGENT})
    url = server + "/updateReports?{}".format(qs)
    for _ in WebSocket(url):
        pass


if __name__ == "__main__":
    print("Run `wstest -m fuzzingserver` to start test server")
    print("Run all tests:")
    print("\tpython runtests.py")
    print("Run individual tests:")
    print("\tpython runtests.py 1.2.3 3.1.4")
    logging.basicConfig(format='%(message)s', level=logging.DEBUG)
    test_cases = sys.argv[1:]
    if test_cases:
        run_test_cases(test_cases)
    else:
        run_tests()
