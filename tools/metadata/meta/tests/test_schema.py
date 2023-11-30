# mypy: allow-untyped-defs

from ..schema import MetaFile

import pytest
import re

@pytest.mark.parametrize(
    "input,expected_result,expected_exception_type,exception_message",
    [
        (
            {
                "spec": "spec-value",
                "suggested_reviewers": ["reviewer_1", "reviewer_2"]
            },
            MetaFile(spec="spec-value", suggested_reviewers=["reviewer_1", "reviewer_2"]),
            None,
            None
        ),
        (
            {
                "spec": "spec-value",
            },
            MetaFile(spec="spec-value"),
            None,
            None
        ),
        (
            {
                "suggested_reviewers": ["reviewer_1", "reviewer_2"]
            },
            MetaFile(suggested_reviewers=["reviewer_1", "reviewer_2"]),
            None,
            None
        ),
        (
            {},
            MetaFile(),
            None,
            None
        ),
        (
            {
                "spec": "spec-value",
                "suggested_reviewers": ["reviewer_1", 3]
            },
            None,
            ValueError,
            "Input value ['reviewer_1', 3] does not fit one of the expected values for the union"
        ),
        (
            {
                "spec": "spec-value",
                "suggested_reviewers": ["reviewer_1", "reviewer_2"],
                "extra": "test"
            },
            None,
            ValueError,
            "Object contains invalid keys: ['extra']"
        ),
    ])
def test_from_dict(input, expected_result, expected_exception_type, exception_message):
    if expected_exception_type:
        with pytest.raises(expected_exception_type, match=re.escape(exception_message)):
            MetaFile.from_dict(input)
    else:
        assert expected_result == MetaFile.from_dict(input)
