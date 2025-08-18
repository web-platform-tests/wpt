import enum
from enum import Enum
from typing import TypeVar, Union


class Undefined(Enum):
    """
    Class representin special value that indicates that a property is notset.
    """

    UNDEFINED = enum.auto()


UNDEFINED = Undefined.UNDEFINED
"""A special value that indicates that a property is not set."""

T = TypeVar("T")

#: A type hint for a value that can be of a specific type or UNDEFINED.
#: For example, ``Maybe[str]`` is equivalent to ``Union[str, Undefined]``.
Maybe = Union[T, Undefined]
