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
    ws = NSWorkspace.sharedWorkspace()
    regular_predicate = NSPredicate.predicateWithFormat_(f"activationPolicy == {NSApplicationActivationPolicyRegular}")
    running_apps = ws.runningApplications().filteredArrayUsingPredicate_(regular_predicate)
    name_predicate = NSPredicate.predicateWithFormat_(f"localizedName contains[c] '{name}'")
    filtered_apps = running_apps.filteredArrayUsingPredicate_(name_predicate)
    if filtered_apps.count() == 0:
        return None
    app = filtered_apps[0]
    pid = app.processIdentifier()
    if pid == -1:
        return None
    return AXUIElementCreateApplication(pid)


def find_active_tab(browser):
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
    def setup(self, product_name):
        self.product_name = product_name
        self.root = find_browser(self.product_name)

        if not self.root:
            raise Exception(f"Couldn't find application: {product_name}")


    def get_accessibility_api_node(self, title, dom_id):
        tab = find_active_tab(self.root)
        node = find_node(tab, "AXDOMIdentifier", dom_id)
        if not node:
            raise Exception(f"Couldn't find node with ID {dom_id}. Try passing --force-renderer-accessibility.")
        return json.dumps(serialize_node(node))
