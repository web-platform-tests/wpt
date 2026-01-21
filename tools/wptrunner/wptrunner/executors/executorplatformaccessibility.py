from __future__ import annotations

from sys import platform
from typing import List, Optional, Protocol, Union

from mozlog.structuredlog import StructuredLogger

from .base import PlatformAccessibilityNotEnabled
from .protocol import ProtocolPart


class PlatformAccessibilityExecutorImpl(Protocol):
    """Protocol defining the interface for platform accessibility executors."""

    def setup(self, product_name: str, logger: StructuredLogger) -> None: ...
    def test_accessibility_api(
        self, dom_id: str, test: List[List[str]], api: str, url: str
    ) -> List[str]: ...


def valid_api_for_platform(api: str) -> bool:
    if platform == "linux" and api == "Atspi":
        return True
    if platform == "darwin" and api == "AXAPI":
        return True
    if platform == "win32" and (api == "UIA" or api == "IAccessible2"):
        return True
    return False


class PlatformAccessibilityProtocolPart(ProtocolPart):
    """Protocol part for platform accessibility introspection"""

    name = "platform_accessibility"

    def setup(self) -> None:
        self.product_name: str = self.parent.product_name
        self.impl: Optional[PlatformAccessibilityExecutorImpl] = None
        self.__init_platform_executor()

    def __init_platform_executor(self) -> None:
        if platform == "linux":
            try:
                from .platformaccessibility.executoratspi import AtspiExecutorImpl
            except ModuleNotFoundError:
                self.logger.warning(
                    "Accessibility API testing was not enabled, accessibility API tests will fail."
                )
                return

            self.impl = AtspiExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

        if platform == "darwin":
            try:
                from .platformaccessibility.executoraxapi import AXAPIExecutorImpl
            except ModuleNotFoundError:
                self.logger.warning(
                    "Accessibility API testing was not enabled, accessibility API tests will fail."
                )
                return

            self.impl = AXAPIExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

        if platform == "win32":
            try:
                from .platformaccessibility.executorwindowsaccessibility import (
                    WindowsAccessibilityExecutorImpl,
                )
            except ModuleNotFoundError:
                self.logger.warning(
                    "Accessibility API testing was not enabled, accessibility API tests will fail."
                )
                return

            self.impl = WindowsAccessibilityExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

    def test_accessibility_api(
        self, dom_id: str, test: List[List[str]], api: str, url: str
    ) -> Union[str, List[str]]:
        # Tests will pass if they are not applicable for a platform,
        # for example, Windows API tests passed to Linux. Ideally, this will
        # be fixed with a "not applicable".
        if not valid_api_for_platform(api):
            return ""

        # self.impl will not exist ifo --enable-accessibility-api was not included
        # or the necessary python requirements for accessibility API tests have not
        # been installed.
        if not self.impl:
            raise PlatformAccessibilityNotEnabled()

        return self.impl.test_accessibility_api(dom_id, test, api, url)
