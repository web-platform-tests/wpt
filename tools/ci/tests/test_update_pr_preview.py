import BaseHTTPServer
import json
import os
import subprocess
import tempfile
import threading

subject = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', 'update_pr_preview.py'
)
test_host = 'localhost'


class MockHandler(BaseHTTPServer.BaseHTTPRequestHandler, object):
    def do_all(self):
        request = (self.command, self.path)
        self.server.requests.append(request)
        status_code, body = self.server.responses.get(request, (200, '{}'))
        self.send_response(status_code)
        self.end_headers()
        self.wfile.write(body)

    def do_DELETE(self):
        return self.do_all()

    def do_GET(self):
        return self.do_all()

    def do_PATCH(self):
        return self.do_all()

    def do_POST(self):
        return self.do_all()


class MockServer(BaseHTTPServer.HTTPServer, object):
    '''HTTP server that responds to all requests with status code 200 and body
    '{}' unless an alternative status code and body are specified for the given
    method and path in the `responses` parameter.'''
    def __init__(self, address, responses=None):
        super(MockServer, self).__init__(address, MockHandler)
        self.responses = responses or {}
        self.requests = []


def assert_success(returncode):
    assert returncode == 0


def assert_neutral(returncode):
    assert returncode == 78


def assert_fail(returncode):
    assert returncode not in (0, 78)


def run(event_data, responses=None):
    event_data_file = tempfile.mkstemp()[1]
    env = {
        'GITHUB_EVENT_PATH': event_data_file,
        'GITHUB_REPOSITORY': 'test-org/test-repo'
    }
    env.update(os.environ)
    server = MockServer((test_host, 0), responses)
    test_port = server.server_address[1]
    threading.Thread(target=lambda: server.serve_forever()).start()

    try:
        with open(event_data_file, 'w') as handle:
            json.dump(event_data, handle)

        child = subprocess.Popen(
            ['python', subject, 'http://{}:{}'.format(test_host, test_port)],
            env=env
        )

        child.communicate()
    finally:
        server.shutdown()
        os.remove(event_data_file)

    return child.returncode, server.requests


def default_data(action):
    return {
        'pull_request': {
            'number': 543,
            'closed_at': None,
            'head': {
                'sha': 'deadbeef'
            },
            'user': {
                'login': 'rms'
            },
            'labels': [
                {'name': 'foo'},
                {'name': 'bar'}
            ]
        },
        'action': action
    }



def test_close_active_with_label():
    event_data = default_data('closed')
    event_data['pull_request']['closed_at'] = '2019-07-05'
    event_data['pull_request']['labels'].append(
        {'name': 'pull-request-has-preview'}
    )
    delete_label = (
        'DELETE',
        '/repos/test-org/test-repo/issues/543/labels/pull-request-has-preview'
    )
    delete_tag = (
        'DELETE', '/repos/test-org/test-repo/git/refs/tags/pr_preview_543'
    )

    returncode, requests = run(event_data)

    assert_success(returncode)
    assert delete_label in requests
    assert delete_tag in requests


def test_close_active_with_label_error():
    event_data = default_data('closed')
    event_data['pull_request']['closed_at'] = '2019-07-05'
    event_data['pull_request']['labels'].append(
        {'name': 'pull-request-has-preview'}
    )
    responses = {(
        'DELETE',
        '/repos/test-org/test-repo/issues/543/labels/pull-request-has-preview'
    ): (500, '{}')}

    returncode, requests = run(event_data, responses)

    assert_fail(returncode)


def test_close_active_without_label():
    event_data = default_data('closed')
    event_data['pull_request']['closed_at'] = '2019-07-05'

    returncode, requests = run(event_data)

    assert_neutral(returncode)
    assert len(requests) == 0


def test_open_with_label():
    event_data = default_data('opened')
    event_data['pull_request']['labels'].append(
        {'name': 'pull-request-has-preview'}
    )

    returncode, requests = run(event_data)

    assert_success(returncode)
    expected = (
        'PATCH',
        '/repos/test-org/test-repo/git/refs/tags/pr_preview_543'
    )
    assert expected in requests


def test_open_without_label_for_collaborator():
    event_data = default_data('opened')
    responses = {
        ('GET', '/repos/test-org/test-repo/collaborators/rms'): (204, ''),
        ('GET', '/repos/test-org/test-repo/git/refs/tags/pr_preview_543'):
            (404, '{}')
    }

    returncode, requests = run(event_data, responses)

    assert_success(returncode)
    create_label = ('POST', '/repos/test-org/test-repo/issues/543/labels')
    create_tag = ('POST', '/repos/test-org/test-repo/git/refs')
    assert responses.keys()[0] in requests
    assert responses.keys()[1] in requests
    assert create_label in requests
    assert create_tag in requests


def test_open_without_label_for_non_collaborator():
    event_data = default_data('opened')
    responses = {
        ('GET', '/repos/test-org/test-repo/collaborators/rms'): (404, '{}')
    }

    returncode, requests = run(event_data, responses)

    assert_neutral(returncode)
    expected = [(
        'GET', '/repos/test-org/test-repo/collaborators/rms'
    )]
    assert expected == requests


def test_add_unrelated_label():
    event_data = default_data('labeled')
    event_data['label'] = {'name': 'foobar'}
    event_data['pull_request']['labels'].append({'name': 'foobar'})

    returncode, requests = run(event_data)

    assert_neutral(returncode)
    assert len(requests) == 0


def test_add_active_label():
    event_data = default_data('labeled')
    event_data['label'] = {'name': 'pull-request-has-preview'}
    event_data['pull_request']['labels'].append(
        {'name': 'pull-request-has-preview'}
    )
    responses = {(
        'GET', '/repos/test-org/test-repo/git/refs/tags/pr_preview_543'
    ): (404, '{}')}

    returncode, requests = run(event_data, responses)

    assert_success(returncode)
    expected = ('POST', '/repos/test-org/test-repo/git/refs')
    assert responses.keys()[0] in requests
    assert expected in requests


def test_remove_unrelated_label():
    event_data = default_data('unlabeled')
    event_data['label'] = {'name': 'foobar'}

    returncode, requests = run(event_data)

    assert_neutral(returncode)
    assert len(requests) == 0


def test_remove_active_label():
    event_data = default_data('unlabeled')
    event_data['label'] = {'name': 'pull-request-has-preview'}
    responses = {
        ('DELETE', '/repos/test-org/test-repo/git/refs/tags/pr_preview_543'):
        (204, '')
    }

    returncode, requests = run(event_data, responses)

    assert_success(returncode)
    assert responses.keys()[0] in requests


def test_synchronize_without_label():
    event_data = default_data('synchronize')

    returncode, requests = run(event_data)

    assert_neutral(returncode)
    assert len(requests) == 0


def test_synchronize_with_label():
    event_data = default_data('synchronize')
    event_data['pull_request']['labels'].append(
        {'name': 'pull-request-has-preview'}
    )

    returncode, requests = run(event_data)

    assert_success(returncode)
    expected = (
        'PATCH',
        '/repos/test-org/test-repo/git/refs/tags/pr_preview_543'
    )
    assert expected in requests


def test_unrecognized_action():
    event_data = default_data('assigned')

    returncode, requests = run(event_data)

    assert_neutral(returncode)
    assert len(requests) == 0
