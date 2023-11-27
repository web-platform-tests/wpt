from typing import Any, Callable, IO

import yaml

def load_into_object(dict_to_object_loader: Callable[[Any], Any], f: IO[bytes]) -> Any:
    return dict_to_object_loader(yaml.safe_load(f))
