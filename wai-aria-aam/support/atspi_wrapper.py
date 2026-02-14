from __future__ import annotations

import time
from typing import Optional, List, Dict
import warnings

import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi

def poll_for_tab(root: Atspi.Accessible, product: str, url: str, timeout: float) -> Atspi.Accessible:
    """Poll until the tab with the test url is loaded and available in the
       accessibility API. Assumes wptrunner has already started a browser
       process and navigated to the test page.

    :param root: The node in the accessibility API representing the browser process.
    :param product: The name of the browser.
    :param url: The url of the test.
    :param timeout: How long to look for the tab, in seconds.
    :return: Atspi.Accessible representing test document.
    """

    tab = find_tab(root, product, url)
    stop = time.time() + timeout
    while not tab:
        if time.time() > stop:
            raise TimeoutError(f"Timeout looking for url: {url}")
        time.sleep(0.01)
        tab = find_tab(root, product, url)

    return tab


def find_tab(
    root: Atspi.Accessible, product: str, url: str
) -> Optional[Atspi.Accessible]:
    """Find the tab with the test url.

    :param root: The node in the accessibility API representing the browser process.
    :param product: The name of the browser.
    :param url: The url of the test.
    :return: Atspi.Accessible representing test document or None.
    """

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


def is_ready(tab: Atspi.Accessible, product: str, url: str) -> bool:
    """Test whether tab is fully loaded.

    :param tab: Atspi.Accessible representing test document.
    :param product: The name of the browser.
    :param url: The url of the test.
    :return: Boolean.
    """

    # Firefox uses the "BUSY" state to indicate the page is not ready.
    if product == "firefox":
        state_set = Atspi.Accessible.get_state_set(tab)
        return not Atspi.StateSet.contains(state_set, Atspi.StateType.BUSY)

    # Chromium family browsers do not use "BUSY", but you can
    # tell if the document can be queried by URL attribute. If the 'URI'
    # attribute is not here, we need to query for a new accessible object.
    document = Atspi.Accessible.get_document_iface(tab)
    document_attributes = Atspi.Document.get_document_attributes(document)

    return "URI" in document_attributes and document_attributes["URI"] == url


def find_browser(pid: int) -> Optional[Atspi.Accessible]:
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


def find_browser_by_name(name: str) -> Optional[Atspi.Accessible]:
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


def find_node(root: Atspi.Accessible, dom_id: str) -> Optional[Atspi.Accessible]:
    """Find the Atspi.Accessible with a specified dom_id.

    :dom_id: The dom ID.
    :return: TestNode or None if not found.
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
            self.root = find_browser(self.pid)
        else:
            self.root = find_browser_by_name(self.product_name)

        if not self.root:
            warnings.warn(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI. Accessibility API queries will not succeed."
            )


    @property
    def Accessible(self):
        return Atspi.Accessible

    def _poll_for_tab_if_necessary(self, url: str) -> None:
        """If accessible node representing the test document for this URL has
           not been found, find it and set self.document.

        :param url: The url of the test.
        """
        if not self.root:
            raise Exception(
                f"Couldn't find browser {self.product_name} in accessibility API ATSPI. Did you turn on accessibility?"
            )

        if self.test_url != url or not self.document:
            self.test_url = url
            self.document = poll_for_tab(self.root, self.product_name, url, self.timeout)


    def find_node(self, dom_id: str, url: str) -> Atspi.Accessible:
        """
        :param dom_id: The dom id of the node to test.
        :param url: The url of the test.
        """
        self._poll_for_tab_if_necessary(url)

        test_node = find_node(self.document, dom_id)
        if not test_node:
            raise Exception(
                f"Couldn't find node with id {dom_id} in accessibility API ATSPI."
            )

        return test_node


    def get_relations_dictionary_helper(self, node: Atspi.Accessible) -> Dict[str, List[str]]:
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
