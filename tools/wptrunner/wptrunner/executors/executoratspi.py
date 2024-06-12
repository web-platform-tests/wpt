import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi
import json
import threading

def find_active_tab(root):
    stack = [root]
    while stack:
        node = stack.pop()

        if Atspi.Accessible.get_role_name(node) == "frame":
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
    def start_atspi_listener(self):
        self._event_listener = Atspi.EventListener.new(self.handle_event)
        self._event_listener.register("document:load-complete")
        Atspi.event_main()

    def handle_event(self, e):
        app = Atspi.Accessible.get_application(e.source)
        app_name = Atspi.Accessible.get_name(app)
        if self.full_app_name == app_name and e.any_data:
            self.load_complete = True
            self._event_listener.deregister("document:load-complete")
            Atspi.event_quit()

    def setup(self, product_name):
        self.product_name = product_name
        self.full_app_name = ""
        self.root = None
        self.found_browser = False
        self.load_complete = False

        self.atspi_listener_thread = threading.Thread(target=self.start_atspi_listener)

        (self.root, self.full_app_name) = find_browser(self.product_name)
        if self.root:
            self.found_browser = True
            self.atspi_listener_thread.start()
        else:
            print(
                f"Cannot find root accessibility node for {self.product_name} - did you turn on accessibility?"
            )

    def get_accessibility_api_node(self, dom_id):
        if not self.found_browser:
            raise Exception(
                f"Couldn't find browser {self.product_name}. Did you turn on accessibility?"
            )

        if not self.load_complete:
            self.atspi_listener_thread.join()

        active_tab = find_active_tab(self.root)
        if not active_tab:
            raise Exception(
                f"Could not find the test page within the browser. Did you turn on accessiblity?"
            )

        node = find_node(active_tab, dom_id)
        if not node:
            raise Exception(f"Couldn't find node with id {dom_id}.")

        return json.dumps(serialize_node(node))
