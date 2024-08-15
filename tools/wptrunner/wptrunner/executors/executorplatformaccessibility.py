from .protocol import ProtocolPart

from abc import ABCMeta
from sys import platform

linux = False
mac = False
windows = False
if platform == "linux":
    linux = True
    from .executoratspi import *
if platform == "darwin":
    mac = True
    from .executoraxapi import *
if platform == "win32":
    windows = True
    from .executorwindowsaccessibility import WindowsAccessibilityExecutorImpl

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
            self.impl.setup(self.product_name)
        if windows:
            self.impl = WindowsAccessibilityExecutorImpl()
            self.impl.setup(self.product_name)

    def get_accessibility_api_node(self, dom_id, url):
        return self.impl.get_accessibility_api_node(dom_id, url)

    def test_accessibility_api(self, dom_id, test, api, url):
        # TODO: this is a bit of a hack, it will cause the test to
        # "pass" with no assertions ran. We will use this until WPT supports
        # some kind of "not applicable" test result.
        if not valid_api_for_platform(api):
          return ""

        return self.impl.test_accessibility_api(dom_id, test, api, url)
