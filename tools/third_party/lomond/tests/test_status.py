from lomond.status import Status


def test_constants():
    expected_constants = {
        'BAD_DATA', 'DATA_NOT_UNDERSTOOD', 'EXTENSION_FAILED', 'GOING_AWAY',
        'MESSAGE_TOO_LARGE', 'NORMAL', 'POLICY_VIOLATION', 'PROTOCOL_ERROR',
        'UNEXPECTED_CONDITION'
    }

    assert expected_constants == set(filter(
        lambda constant: constant.isupper(),
        dir(Status)
    ))
