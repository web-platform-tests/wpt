import pytest

from webdriver.transport import Response

from tests.support.asserts import assert_error, assert_success


def execute_script(session, script, args=None):
    if args is None:
        args = []
    body = {"script": script, "args": args}

    return session.transport.send(
        "POST", "/session/{session_id}/execute/sync".format(
            session_id=session.session_id),
        body)


def test_null_parameter_value(session, http):
    path = "/session/{session_id}/execute/sync".format(**vars(session))
    with http.post(path, None) as response:
        assert_error(Response.from_http(response), "invalid argument")


def test_no_browsing_context(session, closed_window):
    response = execute_script(session, "return 1;")
    assert_error(response, "no such window")


def test_ending_comment(session):
    response = execute_script(session, "return 1; // foo")
    assert_success(response, 1)


@pytest.mark.parametrize("values", [
      {"primitive": "null", "expected": None},
      {"primitive": "undefined", "expected": None},
      {"primitive": "true", "expected": True},
      {"primitive": "false", "expected": False},
      {"primitive": "23", "expected": 23},
      {"primitive": "'a string'", "expected": "a string"}
    ])
def test_primitive_serialization(session, values):
    response = execute_script(session, "return %s;" % values["primitive"])
    assert_success(response)
    assert response.body["value"] == values["expected"]


# > To clone an object, taking the arguments value, seen, and clone algorithm:
# >
# > 1. Let result be the value of the first matching statement, matching on
# > value:
# >
# >     instance of NodeList
# >     instance of HTMLCollection
# >     instance of Array
# >         A new Array which length property is equal to the result of getting
# >         the property length of value.
# >     Otherwise
# >         A new Object.
#
# https://w3c.github.io/webdriver/#dfn-clone-an-object
@pytest.mark.parametrize("collection", [
  "[]",
  "document.createElement('div').childNodes",
  "document.createElement('div').children"
])
def test_array_serialization(session, collection):
    response = execute_script(session, "return %s;" % collection)
    assert_success(response)
    assert isinstance(response.body["value"], list)
    assert len(response.body["value"]) == 0


@pytest.mark.parametrize("collection", [
  "[]",
  "document.createElement('div').childNodes",
  "document.createElement('div').children"
])
def test_foreign_array_serialization(session, create_window, collection):
    session.window_handle = create_window()

    response = execute_script(session, "return %s;" % collection)
    assert_success(response)
    assert isinstance(response.body["value"], list)
    assert len(response.body["value"]) == 0


@pytest.mark.parametrize("non_array", [
  "(function() { return arguments; }(1, 2, 3))",
  "new Proxy([1, 2, 3], {})",
  "({length: 3, 0: 1, 1: 2, 2: 3})"
])
def test_non_array_serialization(session, non_array):
    response = execute_script(session, "return %s;" % non_array)
    assert_success(response)
    value = response.body["value"]
    assert isinstance(value, dict)
    assert "length" in value
    assert value["length"] == 3
    assert "0" in value
    assert value["0"] == 1
    assert "1" in value
    assert value["1"] == 2
    assert "2" in value
    assert value["2"] == 3


@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_abort_by_user_prompt(session, dialog_type):
    response = execute_script(
        session, "window.{}('Hello'); return 1;".format(dialog_type))
    assert_success(response, None)

    session.alert.accept()


@pytest.mark.parametrize("dialog_type", ["alert", "confirm", "prompt"])
def test_abort_by_user_prompt_twice(session, dialog_type):
    response = execute_script(
        session, "window.{0}('Hello'); window.{0}('Bye'); return 1;".format(dialog_type))
    assert_success(response, None)

    session.alert.accept()

    # The first alert has been accepted by the user prompt handler, the second one remains.
    # FIXME: this is how browsers currently work, but the spec should clarify if this is the
    #        expected behavior, see https://github.com/w3c/webdriver/issues/1153.
    assert session.alert.text == "Bye"

    session.alert.accept()
