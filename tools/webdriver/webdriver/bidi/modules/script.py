from typing import Any, Optional, Mapping, MutableMapping

from ._module import BidiModule, command


class Script(BidiModule):
    @command
    def evaluate(self,
          expression: str,
          target: Mapping[str, Any],
          await_promise: Optional[bool] = None, ) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "expression": expression,
            "target": target.to_param(),
        }

        if await_promise is not None:
            params["awaitPromise"] = await_promise
        return params

    @evaluate.result
    def _evaluate(self, result: Mapping[str, Any]) -> Any:
        return result

    def realm_target(self, realm: str) -> Mapping[str, Any]:
        return {"realm": realm}

    def context_target(self, context: str,
          sandbox: Optional[str] = None) -> Mapping[str, Any]:
        target_param = {"context": context}
        if sandbox is not None:
            target_param["sandbox"] = sandbox
        return target_param
