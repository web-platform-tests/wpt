from pyppeteer import Connection, errors

import pytest
import six

@pytest.fixture
def session(chrome):
    connection = Connection(chrome['port'], chrome['webSocketDebuggerUrl'])
    connection.open()

    yield connection.create_session(chrome['targetId'])

    connection.close()

def test_evaluate(session):
    result = session.evaluate('2 + 2;')

    assert isinstance(result, object)
    assert 'value' in result
    assert result['value'] == 4

def test_evaluate_syntax_error(session):
    with pytest.raises(errors.ScriptError):
        session.evaluate('return;')

def test_evaluate_runtime_error(session):
    with pytest.raises(errors.ScriptError):
        session.evaluate('throw 0;')

def test_execute_script(session):
    assert session.execute_script('return 2 + 2;') == 4

def test_execute_script_non_primitive(session):
    assert session.execute_script('return [1, 2, 3];') == [1, 2, 3]

def test_execute_script_error(session):
    with pytest.raises(errors.ScriptError):
        session.execute_script('throw 0;')

def test_execute_async_script_callback(session):
    result = session.execute_async_script('''
        var done = arguments[arguments.length - 1];
        setTimeout(function() {
            done(3 + 4);
        }, 0);
    ''')

    assert result == 7

def test_execute_async_script_callback_non_primitive(session):
    result = session.execute_async_script('''
        var done = arguments[arguments.length - 1];
        setTimeout(function() {
            done([2, 3, 4]);
        }, 0);
    ''')

    assert result == [2, 3, 4]


def test_execute_async_script_promise(session):
    result = session.execute_async_script('return Promise.resolve(5 + 8);')

    assert result == 13

def test_execute_async_script_promise_non_primitive(session):
    result = session.execute_async_script('return Promise.resolve([3, 4, 5]);')

    assert result == [3, 4, 5]

def test_execute_async_script_promise_reject(session):
    with pytest.raises(errors.ScriptError):
        session.execute_async_script('return Promise.reject();')

def test_navigate(session):
    session.navigate('data:text/html,<title>Hello</title>')

    assert session.evaluate('document.title')['value'] == 'Hello'

def test_query_selector_all(session):
    session.navigate('''data:text/html,
    <body>
        <a></a>
        <p>
          <i>
            <a>2</a>
          </i>
        </p>
    </body>
    ''')

    assert len(session.query_selector_all('i')) == 1
    assert len(session.query_selector_all('a')) == 2
    assert len(session.query_selector_all('p i')) == 1
    assert len(session.query_selector_all('p a')) == 1
    assert len(session.query_selector_all('p > i')) == 1
    assert len(session.query_selector_all('p > a')) == 0

def test_screenshot(session):
    result = session.screenshot()

    assert isinstance(result, object)
    assert 'data' in result
    assert isinstance(result['data'], six.string_types)
    assert len(result['data']) > 0

def test_set_window_bounds(session):
    original_width = session.evaluate('outerWidth')['value']
    original_height = session.evaluate('outerHeight')['value']

    session.set_window_bounds({
        'width': original_width - 20,
        'height': original_height - 40
    })

    updated_width = session.evaluate('outerWidth')['value']
    updated_height = session.evaluate('outerHeight')['value']

    assert original_width - updated_width == 20
    assert original_height - updated_height == 40
