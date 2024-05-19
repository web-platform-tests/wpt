from ApplicationServices import (
    AXUIElementRef,
    AXUIElementCopyAttributeNames,
    AXUIElementCopyAttributeValue,
    AXUIElementCopyParameterizedAttributeValue,
    AXUIElementCopyParameterizedAttributeNames,
    AXUIElementIsAttributeSettable,
    AXUIElementCopyActionNames,
    AXUIElementSetAttributeValue,
    AXUIElementCreateApplication,
    AXUIElementCopyMultipleAttributeValues,
    AXUIElementCopyActionDescription,
    AXValueRef,
    AXValueGetType,
    kAXValueAXErrorType,
)

class AXAPIExecutorImpl:
    def setup(self, product_name):
        self.product_name = product_name

    def get_application_by_name(self, name):
        # TODO: copied directly from https://github.com/eeejay/pyax/blob/main/src/pyax/_uielement.py
        wl = CGWindowListCopyWindowInfo(
            kCGWindowListExcludeDesktopElements, kCGNullWindowID
        )
        for w in wl:
            n = w.valueForKey_("kCGWindowOwnerName")
            if name == w.valueForKey_("kCGWindowOwnerName"):
                return AXUIElementCreateApplication(
                    int((w.valueForKey_("kCGWindowOwnerPID")))
                )

    def get_accessibility_api_node(self, dom_id):
        app = self.get_application_by_name(self.product_name)

