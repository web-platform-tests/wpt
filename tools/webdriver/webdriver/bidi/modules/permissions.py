from typing import Any, Optional, Mapping, MutableMapping
from webdriver.bidi.undefined import UNDEFINED

from ._module import BidiModule, command


class Permissions(BidiModule):
    @command
    def set_permission(self,
                    descriptor: Optional[Mapping[str, Any]] = UNDEFINED,
                    state: Optional[str] = UNDEFINED,
                    origin: Optional[str] = UNDEFINED) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "descriptor": descriptor,
            "state": state,
            "origin": origin
        }
        return params
