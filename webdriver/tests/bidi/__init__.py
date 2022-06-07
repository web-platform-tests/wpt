from typing import Any


# Compares 2 objects recursively.
# Actual value can have more keys as part of the forwards-compat design.
# Expected value can be a callable delegate, asserting the value.
def recursive_compare(expected: Any, actual: Any) -> None:
    assert type(expected) == type(actual)
    if type(expected) is list:
        assert len(expected) == len(actual)
        for index, val in enumerate(expected):
            recursive_compare(expected[index], actual[index])
        return

    if type(expected) is dict:
        # Actual dict can have more keys as part of the forwards-compat design.
        assert expected.keys() <= actual.keys(), \
            f"Key set should be present: {set(expected.keys()) - set(actual.keys())}"
        for index, val in enumerate(expected):
            expected_val = expected[val]
            if callable(expected_val):
                expected_val(actual[val])
            else:
                recursive_compare(expected[val], actual[val])
        return

    assert expected == actual


def any_string(expected: Any) -> None:
    assert isinstance(expected, str)
