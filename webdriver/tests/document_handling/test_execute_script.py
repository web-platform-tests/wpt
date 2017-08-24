import pytest

from tests.support.asserts import assert_same_element
from tests.support.inline import inline
from webdriver.client import element_key


# Ported from Mozilla's marionette's test suite.

# TODO:
# * Return a window proxy
# * Throw an exception during JS execution
# * All error cases
# * Probably more.

def assert_elements_equal(session, expected, actual):
    assert len(expected) == len(actual)
    for e, a in zip(expected, actual):
        e_id = e[element_key] if isinstance(e, dict) else e.json()[element_key]
        a_id = a[element_key] if isinstance(a, dict) else a.json()[element_key]
        assert e_id == a_id


# All tests navigate to an HTML page to ensure that JS
# can be executed. It's unknown whether the default start
# page for all browsers allows JS execution.


def test_return_number(session):
    session.url = inline("""<title>JS testing</title>""")
    assert 1 == session.execute_script("return 1")
    assert 1.5 == session.execute_script("return 1.5")


def test_return_boolean(session):
    session.url= inline("""<title>JS testing</title>""")
    assert True == session.execute_script("return true")


def test_return_string(session):
    session.url= inline("""<title>JS testing</title>""")
    assert "foo" == session.execute_script("return 'foo'")


def test_return_array(session):
    session.url= inline("""<title>JS testing</title>""")
    assert [1, 2] ==  session.execute_script("return [1, 2]")
    assert [1.25, 1.75] ==  session.execute_script("return [1.25, 1.75]")
    assert [True, False] == session.execute_script("return [true, false]")
    assert ["foo", "bar"] == session.execute_script("return ['foo', 'bar']")
    assert [1, 1.5, True, "foo"] == session.execute_script("return [1, 1.5, true, 'foo']")
    assert [1, [2]] == session.execute_script("return [1, [2]]")


def test_return_object(session):
    session.url= inline("""<title>JS testing</title>""")
    assert {"foo": 1} == session.execute_script("return {foo: 1}")
    assert {"foo": 1.5} == session.execute_script("return {foo: 1.5}")
    assert {"foo": True} == session.execute_script("return {foo: true}")
    assert {"foo": "bar"} == session.execute_script("return {foo: 'bar'}")
    assert {"foo": [1, 2]} == session.execute_script("return {foo: [1, 2]}")
    assert {"foo": {"bar": [1, 2]}} == \
        session.execute_script("return {foo: {bar: [1, 2]}}")


def test_no_return_value(session):
    session.url= inline("""<title>JS testing</title>""")
    assert None == session.execute_script("true")


def test_argument_null(session):
    session.url= inline("""<title>JS testing</title>""")
    assert None == session.execute_script("return arguments[0]", args=[None])


def test_argument_number(session):
    session.url= inline("""<title>JS testing</title>""")
    assert 1 == session.execute_script("return arguments[0]", args=[1])
    assert 1.5 == session.execute_script("return arguments[0]", args=[1.5])


def test_argument_boolean(session):
    session.url= inline("""<title>JS testing</title>""")
    assert True == session.execute_script("return arguments[0]", args=[True])


def test_argument_string(session):
    session.url= inline("""<title>JS testing</title>""")
    assert "foo" == session.execute_script("return arguments[0]", args=["foo"])


def test_argument_array(session):
    session.url= inline("""<title>JS testing</title>""")
    assert [1, 2] == session.execute_script("return arguments[0]", args=[[1, 2]])


def test_argument_object(session):
    session.url= inline("""<title>JS testing</title>""")
    assert {"foo": 1} == session.execute_script(
            "return arguments[0]", args=[{"foo": 1}])

globals = set([
              "atob",
              "Audio",
              "btoa",
              "document",
              "navigator",
              "URL",
              "window",
              ])

def test_default_sandbox_globals(session):
    session.url= inline("""<title>JS testing</title>""")
    for property in globals:
        assert property == session.execute_script(
            "return typeof arguments[0] != 'undefined' ? arguments[0] : null",
            args=[property])


def test_return_web_element(session):
    session.url = inline("""<body><p>Cheese""")
    expected = session.find.css("p", all=False)
    actual = session.execute_script(
            "return document.querySelector('p')")
    assert_same_element(session, expected.json(), actual)


def test_return_web_element_array(session):
    session.url = inline("""<p>Cheese <p>Peas""")
    expected = session.find.css("p")
    actual = session.execute_script("""
            let els = document.querySelectorAll('p');
            return [els[0], els[1]]""")
    assert_elements_equal(session, expected, actual)


def test_return_web_element_nodelist(session):
    session.url = inline("""<p>Peas <p>Cheese""")
    expected = session.find.css("p")
    actual = session.execute_script("return document.querySelectorAll('p')")
    assert_elements_equal(session, expected, actual)


def test_sandbox_reuse(session):
    session.url= inline("""<title>JS testing</title>""")
    session.execute_script("window.foobar = [23, 42];")
    assert [23, 42] == session.execute_script("return window.foobar")


def test_no_args(session):
    session.url= inline("""<title>JS testing</title>""")
    assert True == session.execute_script(
        "return typeof arguments[0] == 'undefined'")


def test_toJSON(session):
    session.url= inline("""<title>JS testing</title>""")
    foo = session.execute_script("""
            return {
              toJSON () {
                return "foo";
              }
            }""")
    assert "foo" == foo


def test_unsafe_toJSON(session):
    session.url= inline("""<title>JS testing</title>""")
    el = session.execute_script("""
            return {
              toJSON () {
                return document.documentElement;
              }
            }""")
    expected = session.execute_script("return document.documentElement")
    assert_same_element(session, expected, el)


def test_html_all_collection(session):
    session.url = inline("<p>foo <p>bar")
    els = session.execute_script("return document.all")

    # <html>, <head>, <body>, <p>, <p>
    assert 5 == len(els)


def test_html_form_controls_collection(session):
    session.url = inline("<form><input><input></form>")
    actual = session.execute_script("return document.forms[0].elements")
    expected = session.find.css("input")
    assert_elements_equal(session, expected, actual)


