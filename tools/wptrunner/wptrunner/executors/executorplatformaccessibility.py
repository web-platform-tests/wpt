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

    def get_accessibility_api_node(self, title, dom_id):
        return self.impl.get_accessibility_api_node(title, dom_id)
