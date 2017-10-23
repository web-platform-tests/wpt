import os


def expected_path(expectation_root, test_path):
    """Path to the expectation data file for a given test path.

    This is defined as metadata_path + relative_test_path + .ini

    :param expectation_root: Path to the root of the metadata directory
    :param test_path: Relative path to the test file from the test root
    """
    args = list(test_path.split("/"))
    args[-1] += ".ini"
    return os.path.join(expectation_root, *args)
