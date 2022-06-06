# Compares 2 objects recursively ignoring values of specific attributes.
def recursive_compare(expected, actual, ignore_attributes=None):
    if ignore_attributes is None:
        ignore_attributes = []
    assert type(expected) == type(actual)
    if type(expected) is list:
        assert len(expected) == len(actual)
        for index, val in enumerate(expected):
            recursive_compare(expected[index], actual[index], ignore_attributes)
        return

    if type(expected) is dict:
        assert expected.keys() == actual.keys(), \
            f"Key sets should be the same: " \
            f"\nNot present: {set(expected.keys()) - set(actual.keys())}" \
            f"\nUnexpected: {set(actual.keys()) - set(expected.keys())}"
        for index, val in enumerate(expected):
            if val not in ignore_attributes:
                recursive_compare(expected[val], actual[val], ignore_attributes)
        return

    assert expected == actual
