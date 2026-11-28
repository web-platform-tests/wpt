from typing import Any, Mapping

from ._module import BidiModule, command
from ..undefined import UNDEFINED, Maybe


class Autofill(BidiModule):
    @command
    def trigger(
        self,
        context: str,
        element: Mapping[str, Any],
        card: Maybe[Mapping[str, Any]] = UNDEFINED,
        address: Maybe[Mapping[str, Any]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        return {
            "context": context,
            "element": element,
            "card": card,
            "address": address,
        }
