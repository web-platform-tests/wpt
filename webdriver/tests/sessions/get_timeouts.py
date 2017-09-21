from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline


def get_timeouts(session):
    return session.transport.send("GET", "session/{session_id}/timeouts"
                                  .format(session_id=session.session_id))


# 8.4 Get Timeouts

def test_get_timeouts(session):
    # 8.4 step 1
    response = get_timeouts(session)

    assert isinstance(response.body["value"]["script"], int)
    assert isinstance(response.body["value"]["implicit"], int)
    assert isinstance(response.body["value"]["pageLoad"], int)
    return assert_success(response)
