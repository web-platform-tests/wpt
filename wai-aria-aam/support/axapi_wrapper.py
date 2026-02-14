from typing import Optional, Any

import warnings

from ApplicationServices import (
    AXUIElementCopyAttributeNames,
    AXUIElementCopyAttributeValue,
    AXUIElementCreateApplication,
)

from Cocoa import (
    NSApplicationActivationPolicyRegular,
    NSPredicate,
    NSWorkspace,
)

def find_browser(name: str) -> Optional[Any]:
    """Find the AXUIElement representing the browser.

    :param name: The name of the browser.
    :return: AXUIElement or None.
    """

    ws = NSWorkspace.sharedWorkspace()
    regular_predicate = NSPredicate.predicateWithFormat_(
        f"activationPolicy == {NSApplicationActivationPolicyRegular}"
    )
    running_apps = ws.runningApplications().filteredArrayUsingPredicate_(
        regular_predicate
    )
    name_predicate = NSPredicate.predicateWithFormat_(
        f"localizedName contains[c] '{name}'"
    )
    filtered_apps = running_apps.filteredArrayUsingPredicate_(name_predicate)
    if filtered_apps.count() == 0:
        return None
    app = filtered_apps[0]
    pid = app.processIdentifier()
    if pid == -1:
        return None
    return AXUIElementCreateApplication(pid)


def find_active_tab(browser: Any) -> Optional[Any]:
    """Find the active tab of the browser.

    :param browser: The name of the browser.
    :return: AXUIElement representing test document or None.
    """

    stack = [browser]
    while stack:
        node = stack.pop()

        err, role = AXUIElementCopyAttributeValue(node, "AXRole", None)
        if err:
            continue
        if role == "AXWebArea":
            return node

        err, children = AXUIElementCopyAttributeValue(node, "AXChildren", None)
        if err:
            continue
        stack.extend(children)

    return None


def find_node(root: Any, attribute: str, expected_value: str) -> Optional[Any]:
    """Find the AXUIElement with a specified dom_id.

    :root: The root of a subtree to search.
    :attribute: Any AXAPI attribute.
    :param expected_value: The expected value of the attribute.
    :return: AXUIElement or None if not found.
    """

    stack = [root]
    while stack:
        node = stack.pop()

        err, attributes = AXUIElementCopyAttributeNames(node, None)
        if err:
            continue
        if attribute in attributes:
            err, value = AXUIElementCopyAttributeValue(node, attribute, None)
            if err:
                continue
            if value == expected_value:
                return node

        err, children = AXUIElementCopyAttributeValue(node, "AXChildren", None)
        if err:
            continue
        stack.extend(children)
    return None


class AxapiWrapper:
    def __init__(self, pid: int, product_name: str, timeout: float) -> None:

        """Setup for accessibility API testing.

        :pid: The PID of the process which exposes the accessibility API.
        :product_name: The name of the browser, used to find the browser in the accessibility API.
        :timeout: The timeout the test harness has set for this test, local timeouts can be set based on it.
        """
        self.product_name = product_name
        self.root: Optional[Any] = find_browser(self.product_name)
        self.timeout: float = timeout

        if not self.root:
            warnings.warn(
                f"Couldn't find browser {self.product_name} in accessibility API AX API. Accessibility API queries will not succeed."
            )

    @property
    def AXUIElementCopyAttributeValue(self):
        return AXUIElementCopyAttributeValue

    def find_node(self, dom_id: str, url: str) -> Optional[Any]:
        tab = find_active_tab(self.root)
        node = find_node(tab, "AXDOMIdentifier", dom_id)
        if not node:
            raise Exception(
                f"Couldn't find node with ID {dom_id} in accessibility API AXAPI."
            )
        return node
