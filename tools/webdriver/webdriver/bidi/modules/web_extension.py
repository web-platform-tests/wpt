from typing import Any, Mapping, MutableMapping

from ._module import BidiModule, command

class WebExtension(BidiModule):
    @command
    def install(self, extensionData: Mapping[str, Any]) -> Mapping[str, Any]:
        params: MutableMapping[str, Any] = { "extensionData": extensionData }
        return params

    @install.result
    def _install(self, result: Mapping[str, Any]) -> str:
        return result.get("extension")

    @command
    def uninstall(self, extension: str):
        params: MutableMapping[str, Any] = { "extension": extension }
        return params
