from typing import Any, Optional, Mapping, MutableMapping

from ._module import BidiModule, command


class Script(BidiModule):
    class Target:
        def to_param(self) -> Mapping[str, Any]:
            pass

    class RealmTarget(Target):
        def __init__(self, realm: str):
            self.realm = realm

        def to_param(self) -> Mapping[str, Any]:
            return {"realm": self.realm}

    class ContextTarget(Target):
        def __init__(self, context: str, sandbox: Optional[str] = None):
            self.context = context
            self.sandbox = sandbox

        def to_param(self) -> Mapping[str, Any]:
            target_param = {"context": self.context}
            if self.sandbox is not None:
                target_param["sandbox"] = self.sandbox
            return target_param

    @command
    def evaluate(self,
                 expression: str,
                 target: Target,
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
