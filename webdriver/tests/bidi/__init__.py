from typing import Any


# Compares 2 objects recursively.
# Actual value can have more keys as part of the forwards-compat design.
# Expected value can be a callable delegate, asserting the value.
# Expected value can be `missing`, in which case the function asserts there is no such a key in the actual object.
def recursive_compare(expected: Any, actual: Any) -> None:
    if callable(expected):
        expected(actual)
        return

    assert type(expected) == type(actual)
    if type(expected) is list:
        assert len(expected) == len(actual)
        for index, _ in enumerate(expected):
            recursive_compare(expected[index], actual[index])
        return

    if type(expected) is dict:
        # Actual dict can have more keys as part of the forwards-compat design.
        expected_missing_keys = set(filter(
            lambda k: expected[k] == missing,
            expected.keys()))
        expected_present_keys = set(expected.keys() - expected_missing_keys)

        assert expected_present_keys <= actual.keys(), \
            f"Key set should be present: {expected_present_keys - set(actual.keys())}"

        for key in expected_missing_keys:
            assert key not in actual, f"Key '{key}' should not be present in {actual}"

        for key in expected_present_keys:
            recursive_compare(expected[key], actual[key])
        return

    assert expected == actual


def missing() -> None:
    pass


def any_string(actual: Any) -> None:
    assert isinstance(actual, str)


def any_int(actual: Any) -> None:
    assert isinstance(actual, int)
