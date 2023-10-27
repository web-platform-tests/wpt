from typing import IO
from .schema import WebFeatureYMLFile
import yaml

WEB_FEATURES_FILENAME = "WEB_FEATURES.yml"

def load(f: IO[bytes]) -> WebFeatureYMLFile:
    return WebFeatureYMLFile.from_dict(yaml.safe_load(f))