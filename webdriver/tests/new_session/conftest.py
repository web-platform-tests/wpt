import pytest

from webdriver.transport import HTTPWireProtocol

def product(a, b):
    return [(a, item) for item in b]


def flatten(l):
    return [item for x in l for item in x]


class Test_Setup():
    def __init__(self, configuration, url_prefix="/"):
        self.transport = HTTPWireProtocol(
            configuration["host"], configuration["port"], url_prefix=url_prefix,
        )

    def new_session(self, body):
        return self.transport.send("POST", "session", body)

    def get_session(self, session_id):
        return self.transport.send("GET", "session/{}".format(session_id))

    def delete_session(self, session_id):
        self.transport.send("DELETE", "session/{}".format(session_id))

    def new_session(self, body):
        return self.transport.send("POST", "session/async", body)


@pytest.fixture(name="add_browser_capabilities")
def fixture_add_browser_capabilities(configuration):

    def add_browser_capabilities(capabilities):
        # Make sure there aren't keys in common.
        assert not set(configuration["capabilities"]).intersection(set(capabilities))
        result = dict(configuration["capabilities"])
        result.update(capabilities)

        return result

    return add_browser_capabilities


@pytest.fixture(name="configuration")
def fixture_configuration(configuration):
  """Remove "acceptInsecureCerts" from capabilities if it exists.

  Some browser configurations add acceptInsecureCerts capability by default.
  Remove it during new_session tests to avoid interference.
  """

  if "acceptInsecureCerts" in configuration["capabilities"]:
    configuration = dict(configuration)
    del configuration["capabilities"]["acceptInsecureCerts"]
  return configuration

@pytest.fixture(name="new_session")
def fixture_new_session(request, configuration, current_session):
    """Start a new session for tests which themselves test creating new sessions.

    :param body: The content of the body for the new session POST request.

    :param delete_existing_session: Allows the fixture to delete an already
     created custom session before the new session is getting created. This
     is useful for tests which call this fixture multiple times within the
     same test.
    """
    custom_session = {}
    setup = Test_Setup(configuration)

    def new_session(body, delete_existing_session=False):
        # If there is an active session from the global session fixture,
        # delete that one first
        if current_session is not None:
            current_session.end()

        if delete_existing_session:
            _delete_session(custom_session["session"]["sessionId"])

        response = setup.new_session(body)
        if response.status == 200:
            custom_session["session"] = response.body["value"]
        return response, custom_session.get("session", None)

    yield new_session

    if custom_session.get("session") is not None:
        setup.delete_session(custom_session["session"]["sessionId"])
        custom_session = None

@pytest.fixture(name="new_async_session")
def fixture_new_async_session(request, configuration):
    """Start a new async session for tests which themselves test creating new sessions.

    :param body: The content of the body for the new session POST request.
    """
    custom_session = {}
    setup = Test_Setup(configuration)

    def init_async_session(body)
        new_async_session_response = setup.new_session(body)
        if new_async_session_response.status == 200:
            custom_session["creation"] = new_async_session_response.body["value"]

        get_session_response = setup.get_session(custom_session["creation"]["sessionCreationId"])
        if get_session_response.status == 200:
            custom_session["session"] = get_session_response.body["value"]

        assert custom_session["creation"]["sessionCreationId"] == custom_session["session"]["sessionId"]
        return new_async_session_response, get_session_response

    yield init_async_session

    if custom_session.get("session") is not None:
        setup.delete_session(custom_session["session"]["sessionId"])
        custom_session = None

@pytest.fixture(name="get_session")
def fixture_get_session(request, configuration):
    """Start a new session and get session information

    :param body: The content of the body for the new session POST request.
    """
    custom_session = {}
    setup = Test_Setup(configuration)

    def get_session(body):
        new_session_response = setup.new_session(body)
        get_session_response = setup.get_session(response.body["value"]["sessionCreationId"])

        if get_session_response.status == 200:
            custom_session["session"] = get_session_response.body["value"]

        return get_session_response.body["value"]

    yield get_session

    if custom_session.get("session") is not None:
        _delete_session(custom_session["session"]["sessionId"])
        custom_session = None