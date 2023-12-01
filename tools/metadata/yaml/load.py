from typing import Any, Callable, Dict, IO, TypeVar
from ..meta.schema import SchemaValue

import yaml

T = TypeVar("T")

def load_dict_to_obj(obj_loader: Callable[[Dict[str, Any]], T], f: IO[bytes]) -> T:
    try:
        raw_data = yaml.safe_load(f)
        return SchemaValue.from_dict(obj_loader, raw_data)
    except Exception as e:
        raise e
