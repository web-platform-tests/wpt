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

import json


def find_browser(name):
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


def find_active_tab(browser):
    """Find the active tab of the browser.

    :param browser: The name of the browser.
    :return: AXUIElement representing test document or None.
    """

    stack = [browser]
    tabs = []
    while stack:
        node = stack.pop()

        (err, role) = AXUIElementCopyAttributeValue(node, "AXRole", None)
        if err:
            continue
        if role == "AXWebArea":
            return node

        (err, children) = AXUIElementCopyAttributeValue(node, "AXChildren", None)
        if err:
            continue
        stack.extend(children)

    return None


def find_node(root, attribute, expected_value):
    """Find the AXUIElement with a specified dom_id.

    :dom_id: The dom ID.
    :return: AXUIElement or None if not found.
    """

    stack = [root]
    while stack:
        node = stack.pop()

        (err, attributes) = AXUIElementCopyAttributeNames(node, None)
        if err:
            continue
        if attribute in attributes:
            (err, value) = AXUIElementCopyAttributeValue(node, attribute, None)
            if err:
                continue
            if value == expected_value:
                return node

        (err, children) = AXUIElementCopyAttributeValue(node, "AXChildren", None)
        if err:
            continue
        stack.extend(children)
    return None


def serialize_node(node):
    """Convert the node to a dictionary for printing/debugging.

    :returns: A dictionary representing the node.
    """
    props = {}
    props["API"] = "axapi"
    (err, role) = AXUIElementCopyAttributeValue(node, "AXRole", None)
    props["role"] = role
    (err, name) = AXUIElementCopyAttributeValue(node, "AXTitle", None)
    props["name"] = name
    (err, description) = AXUIElementCopyAttributeValue(node, "AXDescription", None)
    props["description"] = description

    return props


class AXAPIExecutorImpl:
    def setup(self, product_name, logger):
        """Setup for accessibility API testing.

        :product_name: The name of the browser, used to find the browser in the accessibility API.
        :logger: Logger for logging errors.
        """
        self.product_name = product_name
        self.root = find_browser(self.product_name)

        if not self.root:
            self.logger.error(
                f"Couldn't find browser {self.product_name} in accessibility API AX API. Accessibility API queries will not succeeded."
            )

    def test_accessibility_api(self, dom_id, test, api, url):
        """Execute a test of the accessibility API.

        :param dom_id: The dom id of the node to test.
        :param test: The test statement.
        :param api: The API to test.
        :param url: The url of the test.
        """
        tab = find_active_tab(self.root)
        node = find_node(tab, "AXDOMIdentifier", dom_id)
        if not node:
            raise Exception(
                f"Couldn't find node with ID {dom_id}. Did you turn on accessibility?"
            )

        results = []
        for test_statement in test["AXAPI"]:
            results.append("Fail: Test not implemented.")

        return results
