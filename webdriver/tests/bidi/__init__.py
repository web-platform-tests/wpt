from typing import Any


# Compares 2 objects recursively.
# Actual value can have more keys as part of the forwards-compat design.
# Expected value can be a callable delegate, asserting the value.
def recursive_compare(expected: Any, actual: Any) -> None:
    assert type(expected) == type(actual)
    if type(expected) is list:
        assert len(expected) == len(actual)
        for index, _ in enumerate(expected):
            recursive_compare(expected[index], actual[index])
        return

    if type(expected) is dict:
        # Actual dict can have more keys as part of the forwards-compat design.
        assert expected.keys() <= actual.keys(), \
            f"Key set should be present: {set(expected.keys()) - set(actual.keys())}"
        for key in expected.keys():
            if callable(expected[key]):
                expected[key](actual[key])
            else:
                recursive_compare(expected[key], actual[key])
        return

    assert expected == actual


def any_string(expected: Any) -> None:
    assert isinstance(expected, str)


def any_int(expected: Any) -> None:
    assert isinstance(expected, int)
