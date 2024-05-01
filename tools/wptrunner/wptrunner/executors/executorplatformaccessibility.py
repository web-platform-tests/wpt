from .protocol import ProtocolPart

from abc import ABCMeta
from sys import platform

linux = False
mac = False
windows = False
if platform == "linux":
    linux = True
    from .platformaccessibility.executoratspi import AtspiExecutorImpl
if platform == "darwin":
    mac = True
    from .platformaccessibility.executoraxapi import AXAPIExecutorImpl
if platform == "win32":
    windows = True
    from .platformaccessibility.executorwindowsaccessibility import WindowsAccessibilityExecutorImpl

def valid_api_for_platform(api):
    if (linux and api == "Atspi"):
        return True
    if (mac and api == "AXAPI"):
        return True
    if (windows and (api == "UIA" or api == "IAccessible2")):
        return True
    return False

class PlatformAccessibilityProtocolPart(ProtocolPart):
    """Protocol part for platform accessibility introspection"""
    name = "platform_accessibility"

    def setup(self):
        self.product_name = self.parent.product_name
        self.impl = None
        if linux:
            self.impl = AtspiExecutorImpl()
            self.impl.setup(self.product_name, self.logger)
        if mac:
            self.impl = AXAPIExecutorImpl()
            self.impl.setup(self.product_name, self.logger)
        if windows:
            self.impl = WindowsAccessibilityExecutorImpl()
            self.impl.setup(self.product_name, self.logger)

    def test_accessibility_api(self, dom_id, test, api, url):
        # Tests will pass if they are not applicable for a platform,
        # for example, Windows API tests passed to Linux. Ideally, this will
        # be fixed with a "not applicable".
        if not valid_api_for_platform(api):
          return ""

        return self.impl.test_accessibility_api(dom_id, test, api, url)
