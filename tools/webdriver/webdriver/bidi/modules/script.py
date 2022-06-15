from collections import UserDict
from enum import Enum
from typing import Any, Optional, Mapping, MutableMapping, Union

from ._module import BidiModule, command


class ScriptEvaluateResultException(Exception):
    def __init__(self, result: Mapping[str, Any]):
        self.result = result
        super().__init__("Script execution failed.")


class OwnershipModel(Enum):
    NONE = "none"
    ROOT = "root"


class RealmTarget(UserDict[str, Any]):
    def __init__(self, realm: str):
        UserDict.__init__(self, realm=realm)


class ContextTarget(UserDict[str, Any]):
    def __init__(self, context: str, sandbox: Optional[str] = None):
        UserDict.__init__(self, context=context)
        if sandbox is not None:
            self.data.update({sandbox: sandbox})


class Script(BidiModule):
    @command
    def evaluate(self,
                 expression: str,
                 target: Union[RealmTarget, ContextTarget],
                 await_promise: Optional[bool] = None,
                 result_ownership: Optional[OwnershipModel] = None) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "expression": expression,
            "target": target,
        }

        if await_promise is not None:
            params["awaitPromise"] = await_promise
        if result_ownership is not None:
            params["resultOwnership"] = result_ownership
        return params

    @evaluate.result
    def _evaluate(self, result: Mapping[str, Any]) -> Any:
        if "result" not in result:
            raise ScriptEvaluateResultException(result)
        return result["result"]
