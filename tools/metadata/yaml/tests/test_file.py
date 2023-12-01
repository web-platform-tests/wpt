# mypy: allow-untyped-defs

from ..load import load_dict_to_obj
from dataclasses import dataclass
from io import StringIO
from typing import Sequence

import pytest
import yaml

@dataclass
class SampleClass():
    key: Sequence[str]

def sample_load_dict_to_obj(input):
    return SampleClass(key=input.get("key"))

def test_load_dict_to_obj():
    input_buffer = StringIO("""
key:
  - value1
  - value2
""")
    result = load_dict_to_obj(sample_load_dict_to_obj, input_buffer)
    assert result == SampleClass(key=["value1", "value2"])

def test_load_dict_to_obj_not_dict():
    input_buffer = StringIO("""
- key: 2
""")
    with pytest.raises(ValueError):
        load_dict_to_obj(sample_load_dict_to_obj, input_buffer)

def test_load_dict_to_obj_invalid_yaml():
    input_buffer = StringIO("""
key: 1
- test: value
""")
    with pytest.raises(yaml.parser.ParserError):
        load_dict_to_obj(sample_load_dict_to_obj, input_buffer)
