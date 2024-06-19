import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi
import json
import threading
import time

import sys


def poll_for_active_tab(root, logger, product):
    active_tab = find_active_tab(root, product)
    while not active_tab:
        time.sleep(0.01)
        active_tab = find_active_tab(root, product)

    return active_tab


def find_active_tab(root, product):
    stack = [root]
    while stack:
        node = stack.pop()
        if Atspi.Accessible.get_role_name(node) == "frame":
            relationset = Atspi.Accessible.get_relation_set(node)
            for relation in relationset:
                if relation.get_relation_type() == Atspi.RelationType.EMBEDS:
                    active_tab = relation.get_target(0)
                    if is_ready(active_tab, product):
                        return active_tab
                    else:
                        return None
            continue

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None


def is_ready(active_tab, product):
    # Firefox uses the "BUSY" state to indicate the page is not ready.
    if product == "firefox":
        state_set = Atspi.Accessible.get_state_set(active_tab)
        return not Atspi.StateSet.contains(state_set, Atspi.StateType.BUSY)

    # Chromium family browsers do not use "BUSY", but you can
    # tell if the document can be queried by Title attribute. If the 'Title'
    # attribute is not here, we need to query for a new accessible object.
    # TODO: eventually we should test this against the actual title of the
    # page being tested.
    document = Atspi.Accessible.get_document_iface(active_tab)
    document_attributes = Atspi.Document.get_document_attributes(document)
    if "Title" in document_attributes and document_attributes["Title"]:
        return True
    return False


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
    def setup(self, product_name, logger):
        self.logger = logger
        self.product_name = product_name
        self.full_app_name = ""
        self.root = None
        self.found_browser = False

        (self.root, self.full_app_name) = find_browser(self.product_name)
        if not self.root:
            self.logger.error(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI. Accessibility API queries will not succeeded."
            )


    def get_accessibility_api_node(self, dom_id, url):
        if not self.root:
            raise Exception(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI. Did you turn on accessibility?"
            )

        active_tab = poll_for_active_tab(self.root, self.logger, self.product_name)

        node = find_node(active_tab, dom_id)
        if not node:
            raise Exception(
                f"Couldn't find node with id={dom_id} in accessibility API ATSPI."
            )

        return json.dumps(serialize_node(node))
