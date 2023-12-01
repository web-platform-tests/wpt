# mypy: allow-untyped-defs

from ..load import load_into_dict
from dataclasses import dataclass
from io import StringIO
from typing import Sequence

@dataclass
class SampleClass():
    key: Sequence[str]

def sample_load_to_dict(input):
    return SampleClass(**input)

def test_load_to_dict():
    input_buffer = StringIO("""
key:
  - value1
  - value2
""")
    result = load_into_dict(sample_load_to_dict, input_buffer)
    assert result == SampleClass(key=["value1", "value2"])
