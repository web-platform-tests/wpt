# mypy: allow-untyped-defs

from ..load import load_into_object
from dataclasses import dataclass
from io import StringIO
from typing import Sequence

@dataclass
class SampleClass():
    key: Sequence[str]

def sample_dict_to_object_loader(input):
    print(input)
    return SampleClass(**input)

def test_dict_to_object_loader():
    input_buffer = StringIO("""
key:
  - value1
  - value2
""")
    result = load_into_object(sample_dict_to_object_loader, input_buffer)
    assert result == SampleClass(key=["value1", "value2"])
