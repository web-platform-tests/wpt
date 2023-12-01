from dataclasses import dataclass
from typing import Dict, Optional, List, Any

from ..schema import SchemaValue, validate_dict

"""
YAML filename for meta files
"""
META_YML_FILENAME = "META.yml"

@dataclass
class MetaFile():
    """documented structure of META files.
    Reference: https://github.com/web-platform-tests/wpt/pull/18434
    """

    """a link to the specification covered by the tests in the directory"""
    spec: Optional[str] = None
    """a list of GitHub account username belonging to people who are notified when pull requests
    modify files in the directory
    """
    suggested_reviewers: Optional[List[str]] = None

    _optional_keys = {"spec", "suggested_reviewers"}

    @staticmethod
    def from_dict(obj: Dict[str, Any]) -> 'MetaFile':
        validate_dict(obj, optional_keys=MetaFile._optional_keys)
        spec = SchemaValue.from_union([SchemaValue.from_str, SchemaValue.from_none], obj.get("spec"))
        suggested_reviewers = SchemaValue.from_union(
            [lambda x: SchemaValue.from_list(SchemaValue.from_str, x), SchemaValue.from_none],
            obj.get("suggested_reviewers"))
        return MetaFile(spec, suggested_reviewers)
