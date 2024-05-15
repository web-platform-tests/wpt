import gi
gi.require_version("Atspi", "2.0")
from gi.repository import Atspi
import json
from .protocol import (PlatformAccessibilityProtocolPart)

def find_active_tab(root):
    stack = [root]
    while stack:
        node = stack.pop()

        if Atspi.Accessible.get_role_name(node) == 'frame':
            ## Helper: list of string relations, get targets for relation?
            relationset = Atspi.Accessible.get_relation_set(node)
            for relation in relationset:
              if relation.get_relation_type() == Atspi.RelationType.EMBEDS:
                  return relation.get_target(0)
            contiue

        for i in range(Atspi.Accessible.get_child_count(node)):
            child = Atspi.Accessible.get_child_at_index(node, i)
            stack.append(child)

    return None

def serialize_node(node):
    node_dictionary = {}
    node_dictionary['role'] = Atspi.Accessible.get_role_name(node)
    node_dictionary['name'] = Atspi.Accessible.get_name(node)
    node_dictionary['description'] = Atspi.Accessible.get_description(node)

    # TODO: serialize other attributes
    # states, interfaces, attributes, etc.

    return node_dictionary

def find_node(root, dom_id):
    stack = [root]
    while stack:
        node = stack.pop()

        attributes = Atspi.Accessible.get_attributes(node)
        if 'id' in attributes and attributes['id'] == dom_id:
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
        if name in Atspi.Accessible.get_name(app).lower():
            return app
    return



class AcaciaPlatformAccessibilityProtocolPart(PlatformAccessibilityProtocolPart):
    def handle_event(self, e):
        print(f"---------------- EVENT ----------------")
        print(f"{e.type}")

    def setup(self):
        self.product_name = self.parent.product_name
        self.root = None
        self.found_browser = False

        print(f"---------------- LISTENING ----------------")
        self._event_listener = Atspi.EventListener.new(self.handle_event)
        self._event_listener.register("document:load-complete")

        self.root = find_browser(self.product_name);
        if self.root:
            self.found_browser = True
        else:
            print(f"Cannot find root accessibility node for {self.product_name} - did you turn on accessibility?")

    def get_accessibility_api_node(self, dom_id):
        if not self.found_browser:
            return json.dumps({"role": "couldn't find browser"})

        active_tab = find_active_tab(self.root)
        if not active_tab:
            return json.dumps({"role": "couldn't find active tab"})


        node = find_node(active_tab, dom_id)
        if not node:
            return json.dumps({"role": "couldn't find the node with that ID"})

        return json.dumps(serialize_node(node))


