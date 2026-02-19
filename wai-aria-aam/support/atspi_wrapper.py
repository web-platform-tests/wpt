from __future__ import annotations

import time
from typing import Any, Callable, Optional, List, Dict
import warnings

import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi


class AtspiWrapper:
    def __init__(self, pid: int, product_name: str, timeout: float) -> None:
        """Setup for accessibility API testing.

        :pid: The PID of the process which exposes the accessibility API.
        :product_name: The name of the browser, used to find the browser in the accessibility API.
        :timeout: The timeout the test harness has set for this test, local timeouts can be set based on it.
        """
        self.product_name: str = product_name
        self.pid: int = pid
        self.root: Optional[Atspi.Accessible] = None
        self.document: Optional[Atspi.Accessible] = None
        self.test_url: Optional[str] = None
        self.timeout: float = timeout

        if self.pid and self.pid != 0:
            self.root = self._find_browser_by_pid(self.pid)
        else:
            self.root = self._find_browser_by_name(self.product_name)

        if not self.root:
            raise Exception(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI."
            )

    @property
    def Accessible(self):
        return Atspi.Accessible

    def find_node(self, dom_id: str, url: str) -> Atspi.Accessible:
        """
        :param dom_id: The dom id of the node to test.
        :param url: The url of the test.
        """
        if self.test_url != url or not self.document:
            self.test_url = url
            self.document = self._poll_for(
                self._find_fully_loaded_tab, f"Timeout looking for url: {self.test_url}"
            )

        # Polling for the node with ID because in Firefox the node's
        # id attribute may be set after the tab is ready, leading to flakes.
        test_node = self._poll_for(
            lambda: self._find_node_by_id(self.document, dom_id),
            f"Timout looking for node with id {dom_id} in accessibility API ATSPI.",
        )

        return test_node

    def get_relations_dictionary_helper(
        self, node: Atspi.Accessible
    ) -> Dict[str, List[str]]:
        """
        :returns: A dictionary with relations as keys and the values, DOM ids.
        """
        relations_dict: Dict[str, List[str]] = {}
        relations = Atspi.Accessible.get_relation_set(node)
        for relation in relations:
            name = relation.get_relation_type().value_name.removeprefix("ATSPI_")
            relations_dict[name] = []
            num_targets = relation.get_n_targets()

            for i in range(num_targets):
                target = relation.get_target(i)
                attributes = Atspi.Accessible.get_attributes(target)
                if "id" in attributes:
                    relations_dict[name].append(attributes["id"])
                else:
                    relations_dict[name].append("[unknown id]")

        return relations_dict

    def get_state_list_helper(self, node: Atspi.Accessible) -> List[str]:
        """
        :returns: A list of states for this Atspi.Accessible.
        """
        state_list = Atspi.Accessible.get_state_set(node).get_states()
        state_string_list = []
        for state in state_list:
            state_string_list.append(state.value_name.removeprefix("ATSPI_"))
        return state_string_list

    def _find_browser_by_pid(self, pid: int) -> Optional[Atspi.Accessible]:
        """Find the Atspi.Accessible representing the browser.

        :param pid: The PID of the browser.
        :return: Atspi.Accessible or None.
        """
        desktop = Atspi.get_desktop(0)
        child_count = Atspi.Accessible.get_child_count(desktop)
        for i in range(child_count):
            app = Atspi.Accessible.get_child_at_index(desktop, i)
            if pid == Atspi.Accessible.get_process_id(app):
                return app
        return None

    def _find_browser_by_name(self, name: str) -> Optional[Atspi.Accessible]:
        """Find the Atspi.Accessible representing the browser.

        :param name: The name of the browser.
        :return: Atspi.Accessible or None.
        """
        desktop = Atspi.get_desktop(0)
        child_count = Atspi.Accessible.get_child_count(desktop)
        for i in range(child_count):
            app = Atspi.Accessible.get_child_at_index(desktop, i)
            full_app_name = Atspi.Accessible.get_name(app)
            if name in full_app_name.lower():
                return app
        return None

    def _poll_for(self, find: Callable[[], Any], error: str) -> Atspi.Accessible:
        """Poll until the `find` function returns something.

        :param url: The url of the test.
        :return: Atspi.Accessible representing test document.
        """
        found = find()
        stop = time.time() + self.timeout
        while not found:
            if time.time() > stop:
                raise TimeoutError(error)
            time.sleep(0.01)
            found = find()

        return found

    def _find_fully_loaded_tab(self) -> Optional[Atspi.Accessible]:
        """Find the tab with the test url. Only returns the tab when the tab is ready.

        :param url: The url of the test.
        :return: Atspi.Accessible representing test document or None.
        """
        stack = [self.root]
        while stack:
            node = stack.pop()
            if Atspi.Accessible.get_role_name(node) == "frame":
                relationset = Atspi.Accessible.get_relation_set(node)
                for relation in relationset:
                    if relation.get_relation_type() == Atspi.RelationType.EMBEDS:
                        tab = relation.get_target(0)
                        if self._is_ready(tab, self.test_url):
                            return tab
                        else:
                            return None
                continue

            for i in range(Atspi.Accessible.get_child_count(node)):
                child = Atspi.Accessible.get_child_at_index(node, i)
                stack.append(child)

        return None

    def _is_ready(self, tab: Atspi.Accessible, url: str) -> bool:
        """Test whether tab is fully loaded.

        :param tab: Atspi.Accessible representing test document.
        :param url: The url of the test.
        :return: Boolean.
        """
        # Firefox uses the "BUSY" state to indicate the page is not ready.
        if self.product_name == "firefox":
            state_set = Atspi.Accessible.get_state_set(tab)
            return not Atspi.StateSet.contains(state_set, Atspi.StateType.BUSY)

        # Chromium family browsers do not use "BUSY", but you can
        # tell if the document can be queried by URL attribute. If the 'URI'
        # attribute is not here, we need to query for a new accessible object.
        document = Atspi.Accessible.get_document_iface(tab)
        document_attributes = Atspi.Document.get_document_attributes(document)

        return "URI" in document_attributes and document_attributes["URI"] == url

    def _find_node_by_id(
        self, root: Atspi.Accessible, dom_id: str
    ) -> Optional[Atspi.Accessible]:
        """Find the Atspi.Accessible with a specified dom_id.

        :param root: The root node to search from.
        :param dom_id: The dom ID.
        :return: Atspi.Accessible or None if not found.
        """
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
