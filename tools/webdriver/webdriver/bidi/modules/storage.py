from typing import Any, Dict, List, Mapping, MutableMapping, Optional, Union

from ._module import BidiModule, command

from webdriver.bidi.modules.network import BytesValue


class BrowsingContextPartitionDescriptor(Dict[str, Any]):
    def __init__(self, context: str):
        dict.__init__(self, type="context", context=context)


class StorageKeyPartitionDescriptor(Dict[str, Any]):
    def __init__(self, user_context: Optional[str] = None, source_origin: Optional[str] = None):
        dict.__init__(self, type="storageKey")
        if user_context is not None:
            self["userContext"] = user_context
        if source_origin is not None:
            self["sourceOrigin"] = source_origin


class PartialCookie(Dict[str, Any]):
    def __init__(self, name: str,
                 value: BytesValue,
                 domain: str, secure: Optional[bool] = None):
        dict.__init__(self, name=name, value=value, domain=domain)
        if secure is not None:
            self["secure"] = secure


PartitionDescriptor = Union[StorageKeyPartitionDescriptor, BrowsingContextPartitionDescriptor]


class Storage(BidiModule):
    @command
    def set_cookie(self, cookie: PartialCookie, partition: Optional[PartitionDescriptor] = None) -> \
            Mapping[str, Any]:
        params = {
            'cookie': cookie,
        }
        if partition is not None:
            params["partition"] = partition
        return params
