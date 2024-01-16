from typing import TypeVar, Dict, Union


class Undefined:
    def __init__(self) -> None:
        raise RuntimeError('Import UNDEFINED instead.')


_T = TypeVar('_T')
Maybe = Union[_T, Undefined]

UNDEFINED = Undefined.__new__(Undefined)
