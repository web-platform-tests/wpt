from typing import Any, Dict, Callable, IO

import yaml

def load_into_dict(dict_loader: Callable[[Any], Dict[str, Any]], f: IO[bytes]) -> Dict[str, Any]:
    return dict_loader(yaml.safe_load(f))
