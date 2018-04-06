from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def click(session, element):
    return session.transport.send("POST", "session/{session_id}/element/{element_id}/click"
                                  .format(session_id=session.session_id,
                                          element_id=element.id))


# 14.1 Element Click File Upload Element Tests Step 3

def test_file_upload_state(session):
    session.url = inline("<input type=file>")

    element = session.find.css("input", all=False)
    response = click(session, element)
    assert_error(response, "invalid argument")
