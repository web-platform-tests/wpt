from tests.support.classic.asserts import assert_error, assert_success


def consume_user_activation(session):
    return session.transport.send(
        "POST", "session/{session_id}/window/consume-user-activation".format(
            **vars(session)))


def is_active(session):
    return session.execute_script(
        "return navigator.userActivation.isActive")


def test_no_top_browsing_context(session, closed_window):
    response = consume_user_activation(session)
    assert_error(response, "no such window")


def test_no_browsing_context(session, closed_frame):
    response = consume_user_activation(session)
    assert_success(response)


def test_response_payload(session, inline):
    session.url = inline("<p>foo")

    response = consume_user_activation(session)
    value = assert_success(response)
    assert isinstance(value, bool)


def test_nothing_to_consume(session, inline):
    session.url = inline("<p>foo")
    assert is_active(session) is False

    response = consume_user_activation(session)
    assert_success(response, False)

    assert is_active(session) is False


def test_consume_transient_activation(session, inline):
    session.url = inline("<button>click</button>")
    assert is_active(session) is False

    session.find.css("button", all=False).click()
    assert is_active(session) is True

    response = consume_user_activation(session)
    assert_success(response, True)

    assert is_active(session) is False
