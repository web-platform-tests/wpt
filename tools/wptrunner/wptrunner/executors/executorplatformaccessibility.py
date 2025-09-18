# mypy: allow-untyped-defs

from .protocol import ProtocolPart

from sys import platform

def valid_api_for_platform(api):
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

    def setup(self):
        self.product_name = self.parent.product_name
        self.impl = None
        self.__init_platform_executor()


    def __init_platform_executor(self):
        if platform == "linux":
            try:
                from .platformaccessibility.executoratspi import AtspiExecutorImpl
            except ModuleNotFoundError:
                self.logger.warning("Accessibility API testing was not enabled, accessibility API tests will fail.")
                return

            self.impl = AtspiExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

        if platform == "darwin":
            try:
                from .platformaccessibility.executoraxapi import AXAPIExecutorImpl
            except ModuleNotFoundError:
                self.logger.warning("Accessibility API testing was not enabled, accessibility API tests will fail.")
                return

            self.impl = AXAPIExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

        if platform == "win32":
            try:
                from .platformaccessibility.executorwindowsaccessibility import WindowsAccessibilityExecutorImpl
            except ModuleNotFoundError:
                self.logger.warning("Accessibility API testing was not enabled, accessibility API tests will fail.")
                return

            self.impl = WindowsAccessibilityExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

    def test_accessibility_api(self, dom_id, test, api, url):
        # Tests will pass if they are not applicable for a platform,
        # for example, Windows API tests passed to Linux. Ideally, this will
        # be fixed with a "not applicable".
        if not valid_api_for_platform(api):
            return ""

        # self.impl will not exist if --enable-accessibility-api was not included
        # or the necessary python requirements for accessibility API tests have not
        # been installed.
        if not self.impl:
            subtests = len(test) if test else 1
            return ["Accessibility API testing not enabled."] * subtests

        return self.impl.test_accessibility_api(dom_id, test, api, url)
