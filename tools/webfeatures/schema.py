from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Set, Union, Optional, Any, TypeVar, Callable, Type, cast


T = TypeVar("T")
EnumT = TypeVar("EnumT", bound=Enum)


def validate_obj_keys(obj: Any, required_keys: Set[str], optional_keys: Set[str] = set()) -> None:
    """
    Validates the keys for a particular object

    This logic ensures that at a minimum the provided required_keys are present.
    Additionally, the logic checks for a set of optional_keys. With those two
    sets of keys, the logic will raise an error if there are extra keys in obj.

    :param obj: The object that will be checked.
    :param required_keys: Set of required keys that the obj should have.
    :param optional_keys: Set of optional keys that the obj should have.

    :return: `None` if obj does not have any extra keys.

    :raises ValueError: If there unexpected keys or missing required keys.
    """
    extra_keys = set(obj.keys()) - required_keys - optional_keys
    missing_required_keys = required_keys - set(obj.keys())
    if extra_keys:
        raise ValueError(f"Object contains invalid keys: {extra_keys}")
    if missing_required_keys:
        raise ValueError(f"Object missing required keys: {missing_required_keys}")

def from_list(f: Callable[[Any], T], x: Any) -> List[T]:
    assert isinstance(x, list)
    return [f(y) for y in x]


def from_str(x: Any) -> str:
    assert isinstance(x, str)
    return x


def from_union(fs, x):
    for f in fs:
        try:
            return f(x)
        except:
            pass
    assert False


def from_none(x: Any) -> Any:
    assert x is None
    return x


def to_enum(c: Type[EnumT], x: Any) -> EnumT:
    assert isinstance(x, c)
    return x.value


def to_class(c: Type[T], x: Any) -> dict:
    assert isinstance(x, c)
    return cast(Any, x).to_dict()


class ApplyMode(Enum):
    """A specific file within the current directory
    
    Ignores features from previous parent directories.
    """
    IGNORE_PARENT = "IGNORE_PARENT"


class SpecialFileEnum(Enum):
    """All files recursively"""
    RECURSIVE = "**"


@dataclass
class FeatureEntry:
    files: Union[List[str], SpecialFileEnum]
    """The web feature key"""
    name: str

    _required_keys = {"files", "name"}

    @staticmethod
    def from_dict(obj: Any) -> 'FeatureEntry':
        """
        Converts the provided dictionary to an instance of FeatureEntry

        :param obj: The object that will be converted to a FeatureEntry.

        :return: An instance of FeatureEntry

        :raises ValueError: If there unexpected keys or missing required keys.
        """
        assert isinstance(obj, dict)
        validate_obj_keys(obj, FeatureEntry._required_keys)
        files = from_union([lambda x: from_list(from_str, x), SpecialFileEnum], obj.get("files"))
        name = from_str(obj.get("name"))
        return FeatureEntry(files, name)

    def to_dict(self) -> dict:
        result: dict = {}
        result["files"] = from_union([lambda x: from_list(from_str, x), lambda x: to_enum(SpecialFileEnum, x)], self.files)
        result["name"] = from_str(self.name)
        return result
    
    def does_feature_apply_recursively(self) -> bool:
        if isinstance(self.files, SpecialFileEnum) and self.files == SpecialFileEnum.RECURSIVE:
            return True
        return False


@dataclass
class WebFeatureYMLFile:
    """List of features"""
    features: List[FeatureEntry]
    apply_mode: Optional[ApplyMode] = None

    _required_keys = {"features"}
    _optional_keys = {"apply_mode"}

    @staticmethod
    def from_dict(obj: Any) -> 'WebFeatureYMLFile':
        """
        Converts the provided dictionary to an instance of WebFeatureYMLFile

        :param obj: The object that will be converted to a WebFeatureYMLFile.

        :return: An instance of WebFeatureYMLFile

        :raises ValueError: If there unexpected keys or missing required keys.
        """
        assert isinstance(obj, dict)
        validate_obj_keys(obj, WebFeatureYMLFile._required_keys, WebFeatureYMLFile._optional_keys)
        features = from_list(FeatureEntry.from_dict, obj.get("features"))
        apply_mode = from_union([ApplyMode, from_none], obj.get("apply_mode"))
        return WebFeatureYMLFile(features, apply_mode)

    def to_dict(self) -> dict:
        result: dict = {}
        result["features"] = from_list(lambda x: to_class(FeatureEntry, x), self.features)
        if self.apply_mode is not None:
            result["apply_mode"] = from_union([lambda x: to_enum(ApplyMode, x), from_none], self.apply_mode)
        return result
