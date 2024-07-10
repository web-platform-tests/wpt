import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi
import json
import threading
import time

import sys

def poll_for_active_tab(root):
    active_tab = find_active_tab(root)
    iterations = 0
    while not active_tab:
        time.sleep(0.01)
        active_tab = find_active_tab(root)
        iterations += 1

    print(f"found active tab in {iterations} iterations", file=sys.stderr)
    return active_tab


def find_active_tab(root):
    stack = [root]
    root_role = Atspi.Accessible.get_role_name(root)
    while stack:
        node = stack.pop()
        role= Atspi.Accessible.get_role_name(node)
        if Atspi.Accessible.get_role_name(node) == "frame":
            attributes = Atspi.Accessible.get_attributes(node)
            ## Helper: list of string relations, get targets for relation?
            relationset = Atspi.Accessible.get_relation_set(node)
            for relation in relationset:
                if relation.get_relation_type() == Atspi.RelationType.EMBEDS:
                    return relation.get_target(0)
            continue

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None


def serialize_node(node):
    node_dictionary = {}
    node_dictionary["API"] = "atspi"
    node_dictionary["role"] = Atspi.Accessible.get_role_name(node)
    node_dictionary["name"] = Atspi.Accessible.get_name(node)
    node_dictionary["description"] = Atspi.Accessible.get_description(node)

    return node_dictionary


def find_node(root, dom_id):
    stack = [root]
    while stack:
        node = stack.pop()

        attributes = Atspi.Accessible.get_attributes(node)
        if "id" in attributes and attributes["id"] == dom_id:
            return node

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None


def find_browser(name):
    desktop = Atspi.get_desktop(0)
    child_count = Atspi.Accessible.get_child_count(desktop)
    for i in range(child_count):
        app = Atspi.Accessible.get_child_at_index(desktop, i)
        full_app_name = Atspi.Accessible.get_name(app)
        if name in full_app_name.lower():
            return (app, full_app_name)
    return (None, None)


class AtspiExecutorImpl:
    def setup(self, product_name):
        self.product_name = product_name
        self.full_app_name = ""
        self.root = None
        self.found_browser = False

        (self.root, self.full_app_name) = find_browser(self.product_name)
        if self.root:
            self.found_browser = True
        else:
            print(
                f"Cannot find root accessibility node for {self.product_name} - did you turn on accessibility?"
            )

    def get_accessibility_api_node(self, dom_id):
        if not self.found_browser:
            raise Exception(
                f"Couldn't find browser {self.product_name}. Did you turn on accessibility?"
            )

        active_tab = poll_for_active_tab(self.root)

        state_set = Atspi.Accessible.get_state_set(active_tab)
        iterations = 0
        while Atspi.StateSet.contains(state_set, Atspi.StateType.BUSY):
            state_set = Atspi.Accessible.get_state_set(active_tab)
            iterations += 1
        print(f"active tab no longer busy after {iterations} iterations", file=sys.stderr)
        role = Atspi.Accessible.get_role_name(active_tab)
        attributes = Atspi.Accessible.get_attributes(active_tab)
        print(f"active tab role: {role}; attributes: {attributes}", file=sys.stderr)
        document = Atspi.Accessible.get_document_iface(active_tab)
        document_attributes = Atspi.Document.get_document_attributes(document)
        url = document_attributes["DocURL"]
        print(f"document: {document}; attributes: {document_attributes}, url: {url}", file=sys.stderr)
        node = find_node(active_tab, dom_id)
        if not node:
            raise Exception(f"Couldn't find node with id {dom_id}.")

        return json.dumps(serialize_node(node))
