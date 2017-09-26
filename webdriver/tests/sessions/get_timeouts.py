from tests.support.asserts import assert_success


def get_timeouts(session):
    return session.transport.send("GET", "session/{session_id}/timeouts"
                                  .format(session_id=session.session_id))


# 8.4 Get Timeouts

def test_get_timeouts(session):
    # 8.4 step 1
    response = get_timeouts(session)

    assert_success(response)
    assert "value" in response.body
    assert isinstance(response.body["value"], dict)

    value = response.body["value"]
    assert "script" in value
    assert "implicit" in value
    assert "pageLoad" in value

    assert isinstance(response.body["value"]["script"], int)
    assert isinstance(response.body["value"]["implicit"], int)
    assert isinstance(response.body["value"]["pageLoad"], int)
