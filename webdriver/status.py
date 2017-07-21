import pytest
import json


# TODO: figure out if geckodriver supports sessionless status
# currently response body for GET /status without a session is
# coming back empty
def test_get_status_no_session(http):
    with http.get("status") as response:
        # GET /status should never return an error
        assert response.status == 200

        parsed_obj = json.loads(response.read().decode('utf-8'))

        # Let body be a new JSON Object with the following properties:
        # "ready"
        #       The remote end's readiness state.
        assert parsed_obj["ready"] in [True, False]
        # "message"
        #       An implementation-defined string explaining the remote end's
        #       readiness state.
        assert isinstance(parsed_obj["message"], basestring)
