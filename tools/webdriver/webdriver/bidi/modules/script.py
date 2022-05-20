from typing import Any, Optional, Mapping, MutableMapping

from ._module import BidiModule, command


class Script(BidiModule):
    @command
    def evaluate(self,
          expression: str,
          context: Optional[str] = None,
          realm: Optional[str] = None,
          await_promise: Optional[bool] = None) -> Mapping[str, Any]:

        params: MutableMapping[str, Any] = {
            "expression": expression,
        }

        if (context is not None) or (realm is not None):
            params["target"] = {}

        if context is not None:
            params["target"]["context"] = context

        if realm is not None:
            params["target"]["realm"] = realm

        if await_promise is not None:
            params["awaitPromise"] = await_promise
        return params

    @evaluate.result
    def _evaluate(self, result: Mapping[str, Any]) -> Any:
        return result
