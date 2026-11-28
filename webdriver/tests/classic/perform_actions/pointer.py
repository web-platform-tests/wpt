import pytest

from . import record_pointer_events


@pytest.mark.parametrize(
    "pointer_types, expected_ids",
    [
        (["mouse"], [0]),
        (["pen"], [2]),
        (["touch"], [2]),
        (["touch", "mouse"], [2, 0]),
        (["pen", "mouse"], [2, 0]),
        (["mouse", "mouse", "touch"], [0, 1, 2]),
        (["mouse", "touch", "mouse", "pen"], [0, 2, 1, 3]),
    ],
)
def test_pointer_id_allocation(
    session,
    new_tab_classic,
    test_actions_pointer_page,
    pointer_types,
    expected_ids,
):
    pointer_area = session.find.css("#pointerArea", all=False)
    record_pointer_events(session, pointer_area)

    # Use separate commands so that all input sources share the same input
    # state, but are created in the given order.
    for index, pointer_type in enumerate(pointer_types):
        session.actions.sequence(
            "pointer", f"pointer_{index}", {"pointerType": pointer_type}
        ) \
            .pointer_move(0, 0, origin=pointer_area) \
            .pointer_down() \
            .pointer_up() \
            .perform()

    events = session.execute_script("return window.recordedEvents;")
    pointer_ids = [e["pointerId"] for e in events if e["type"] == "pointerdown"]
    assert pointer_ids == expected_ids
