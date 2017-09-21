from tests.support.asserts import assert_success


def get_timeouts(session):
    return session.transport.send("GET", "session/{session_id}/timeouts"
                                  .format(session_id=session.session_id))


# 8.4 Get Timeouts

def test_get_timeouts(session):
    # 8.4 step 1
    response = get_timeouts(session)

    assert response.status == 200
    # Check if value exist
    assert 'value' in response.body

    # Check if script, implicit, pageLoad exist
    assert 'script' in response.body["value"]
    assert 'implicit' in response.body["value"]
    assert 'pageLoad' in response.body["value"]

    assert isinstance(response.body["value"]["script"], int)
    assert isinstance(response.body["value"]["implicit"], int)
    assert isinstance(response.body["value"]["pageLoad"], int)
    return assert_success(response)
