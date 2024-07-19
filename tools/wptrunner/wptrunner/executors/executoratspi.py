import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi
import json
import threading
import time

import sys


def poll_for_tab(root, product, url):
    tab = find_tab(root, product, url)
    while not tab:
        time.sleep(0.01)
        tab = find_tab(root, product, url)

    return tab


def find_tab(root, product, url):
    stack = [root]
    while stack:
        node = stack.pop()
        if Atspi.Accessible.get_role_name(node) == "frame":
            relationset = Atspi.Accessible.get_relation_set(node)
            for relation in relationset:
                if relation.get_relation_type() == Atspi.RelationType.EMBEDS:
                    tab = relation.get_target(0)
                    if is_ready(tab, product, url):
                        return tab
                    else:
                        return None
            continue

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None


def is_ready(tab, product, url):
    # Firefox uses the "BUSY" state to indicate the page is not ready.
    if product == "firefox":
        state_set = Atspi.Accessible.get_state_set(tab)
        return not Atspi.StateSet.contains(state_set, Atspi.StateType.BUSY)

    # Chromium family browsers do not use "BUSY", but you can
    # tell if the document can be queried by URL attribute. If the 'URL'
    # attribute is not here, we need to query for a new accessible object.
    document = Atspi.Accessible.get_document_iface(tab)
    document_attributes = Atspi.Document.get_document_attributes(document)
    if "URI" in document_attributes and document_attributes["URI"] == url:
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
        self.document = None
        self.test_url = None


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

        if self.test_url != url or not self.document:
            self.test_url = url
            self.document = poll_for_tab(self.root, self.product_name, url)

        node = find_node(self.document, dom_id)
        if not node:
            raise Exception(
                f"Couldn't find node with id={dom_id} in accessibility API ATSPI."
            )

        return json.dumps(serialize_node(node))
