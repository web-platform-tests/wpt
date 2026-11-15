from webdriver import WebElement

from tests.classic.perform_actions import (
    assert_pointer_events,
    perform_actions,
    record_pointer_events,
)
from tests.support.classic.asserts import assert_error, assert_success


def release_actions(session):
    return session.transport.send(
        "DELETE",
        "/session/{session_id}/actions".format(**vars(session)),
    )


def get_actions(pointer_type, element):
    # session.transport.send posts the action dicts as raw JSON, so the element
    # has to be referenced in wire format rather than passed as a WebElement.
    origin = {WebElement.identifier: element.id}

    return [
        {
            "type": "pointer",
            "id": "foo",
            "parameters": {"pointerType": pointer_type},
            "actions": [
                {"type": "pointerMove", "x": 0, "y": 0, "origin": origin},
                {"type": "pointerDown", "button": 0},
                {"type": "pointerUp", "button": 0},
            ],
        }
    ]


def test_null_response_value(session):
    response = release_actions(session)
    assert_success(response, None)


def test_no_top_browsing_context(session, closed_window):
    response = release_actions(session)
    assert_error(response, "no such window")


def test_no_browsing_context(session, closed_frame):
    response = release_actions(session)
    assert_error(response, "no such window")


def test_release_actions_resets_pointer_subtype(session, url):
    session.url = url("/webdriver/tests/support/html/test_actions_pointer.html")
    pointer_area = session.find.css("#pointerArea", all=False)
    record_pointer_events(session, pointer_area)

    assert_success(perform_actions(session, get_actions("mouse", pointer_area)))

    assert_pointer_events(
        session,
        ["pointerdown", "pointerup"],
        "pointerArea",
        "mouse",
        expected_pointer_ids=[0, 0],
    )

    assert_success(release_actions(session))

    # The input source with the "foo" id should have been reset, so that it can
    # be recreated with a different pointer type.
    session.execute_script("window.recordedEvents = [];")
    assert_success(perform_actions(session, get_actions("touch", pointer_area)))

    assert_pointer_events(
        session,
        ["pointerdown", "pointerup"],
        "pointerArea",
        "touch",
        expected_pointer_ids=[2, 2],
    )
