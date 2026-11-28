from typing import Any, Mapping

from ._module import BidiModule, command
from ..undefined import UNDEFINED, Maybe


class Autofill(BidiModule):
    """
    Represents the autofill module specified in
    https://wicg.github.io/autofill-event/#webdriver-bidi-module
    """

    @command
    def trigger(
        self,
        context: str,
        element: Mapping[str, Any],
        card: Maybe[Mapping[str, Any]] = UNDEFINED,
        address: Maybe[Mapping[str, Any]] = UNDEFINED,
    ) -> Mapping[str, Any]:
        """
        Represents the `autofill.trigger` command specified in
        https://wicg.github.io/autofill-event/#webdriver-bidi-trigger
        """
        return {
            "context": context,
            "element": element,
            "card": card,
            "address": address,
        }
