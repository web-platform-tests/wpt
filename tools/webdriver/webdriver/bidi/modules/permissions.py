from typing import Any, Optional, Mapping, MutableMapping

from ._module import BidiModule, command


class Permissions(BidiModule):
    @command
    def end(self) -> Mapping[str, Any]:
        return {}

    @end.result
    async def _end(self, result: Mapping[str, Any]) -> Any:
        if self.session.transport:
            await self.session.transport.wait_closed()

        return result

    @command
    def set_permission(self,
                    descriptor: Optional[Mapping[str, Any]] = None,
                    state: Optional[str] = None,
                    origin: Optional[str] = None) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = {
            "descriptor": descriptor,
            "state": state,
            "origin": origin
        }
        return params
