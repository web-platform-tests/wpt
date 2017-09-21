from tests.support.asserts import assert_error, assert_success


def send_alert_text(session, body=None):
    return session.transport.send("POST", "session/{session_id}/alert/text"
                                  .format(session_id=session.session_id), body)

# Used to check if alert text sent was correct
def accept_alert(session):
    return session.transport.send("POST", "session/{session_id}/alert/accept"
                                  .format(session_id=session.session_id))


# 18.4 Send Alert Text

def test_no_browsing_context(session, create_window):
    # 18.4 step 1
    session.window_handle = create_window()
    session.close()

    body = {
        "text": "Federer"
        }
    response = send_alert_text(session, body)
    assert_error(response, "no such window")


def test_no_user_prompt(session):
    # 18.4 step 2
    body = {
        "text": "Federer"
        }
    response = send_alert_text(session, body)
    assert_error(response, "no such alert")


def test_alert_element_not_interactable(session):
    # 18.4 step 3
    session.execute_script("window.alert(\"Hello\");")
    body = {
        "text": "Federer"
        }
    response = send_alert_text(session, body)
    assert_error(response, "element not interactable")


def test_confirm_element_not_interactable(session):
    # 18.4 step 3
    session.execute_script("window.confirm(\"Hello\");")
    body = {
        "text": "Federer"
        }
    response = send_alert_text(session, body)
    assert_error(response, "element not interactable")


def test_send_alert_text(session):
    # 18.4 step 6
    session.execute_script("window.result = window.prompt(\"Enter Your Name: \", \"Name\");")
    body = {
        "text": "Federer"
        }
    send_response = send_alert_text(session, body)
    assert_success(send_response)
    accept_response = accept_alert(session)
    assert_success(accept_response)
    assert session.execute_script("return window.result") == "Federer"
