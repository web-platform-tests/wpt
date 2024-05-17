from .protocol import (PlatformAccessibilityProtocolPart)

from sys import platform
linux = False
mac = False
if platform == "linux":
  linux = True
  from .executoratspi import *
if platform == "darwin":
  mac = True
  from .executoraxapi import *


class AcaciaPlatformAccessibilityProtocolPart(PlatformAccessibilityProtocolPart):
    def setup(self):
        self.product_name = self.parent.product_name
        self.impl = None
        if linux:
            self.impl = AtspiExecutorImpl()
            self.impl.setup(self.product_name)
        if mac:
            self.impl = AXAPIExecutorImpl()
            self.impl.setup(self.product_name)


    def get_accessibility_api_node(self, dom_id):
      return self.impl.get_accessibility_api_node(dom_id)