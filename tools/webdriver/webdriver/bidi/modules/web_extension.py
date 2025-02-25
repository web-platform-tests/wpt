from typing import Any, Mapping

from ._module import BidiModule, command


class WebExtension(BidiModule):
    @command
    def install(self, params: Mapping[str, str]) -> Mapping[str, Any]:
        """
        Represents a command `webExtension.install` specified in
        https://www.w3.org/TR/webdriver-bidi/#command-webExtension-install
        """

        return params

    @command
    def uninstall(self, extension_id) -> Mapping[str, Any]:
        """
        Represents a command `webExtension.Uninstall` specified in
        https://www.w3.org/TR/webdriver-bidi/#command-webExtension-uninstall
        """

        return {
            "extension": extension_id
        }
