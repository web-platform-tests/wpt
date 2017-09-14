from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline


def accept_alert(session):
    return session.transport.send("POST", "session/{session_id}/alert/accept"
                                  .format(session_id=session.session_id))


# 18.2 Accept Alert

def test_no_browsing_context(session, create_window):
    # 18.2 step 1
    session.window_handle = create_window()
    session.close()

    response = accept_alert(session)
    assert_error(response, "no such window")


def test_no_user_prompt(session):
    # 18.2 step 2
    response = accept_alert(session)
    assert_error(response, "no such alert")


def test_accept_user_prompt(session):
    # 18.2 step 3
    session.url = inline("""
        <SCRIPT Language="JavaScript">
            document.write(prompt("Enter Your Name: ", "Federer"));
        </SCRIPT>
        """)
    response = accept_alert(session)
    element = session.find.css("body", all=False)
    assert element.text == "Federer"
    assert_success(response)
