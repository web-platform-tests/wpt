# mypy: allow-untyped-defs

from ..platformaccessibility.ia2.constants import *  # noqa: F403

import time

import ctypes
from ctypes import POINTER, byref
from ctypes.wintypes import BOOL, HWND, LPARAM

import comtypes.client
from comtypes import IServiceProvider

CHILDID_SELF = 0
OBJID_CLIENT = -4

user32 = ctypes.windll.user32  # type: ignore
oleacc = ctypes.oledll.oleacc  # type: ignore
oleacc_mod = comtypes.client.GetModule("oleacc.dll")
IAccessible = oleacc_mod.IAccessible  # noqa: N816

# CoCreateInstance of UIA also initializes IA2
uia_mod = comtypes.client.GetModule("UIAutomationCore.dll")
uia_client = comtypes.CoCreateInstance(
    uia_mod.CUIAutomation._reg_clsid_,
    interface=uia_mod.IUIAutomation,
    clsctx=comtypes.CLSCTX_INPROC_SERVER,
)


def accessible_object_from_window(hwnd):
    p = POINTER(IAccessible)()
    oleacc.AccessibleObjectFromWindow(
        hwnd, OBJID_CLIENT, byref(IAccessible._iid_), byref(p)
    )
    return p


def name_from_hwnd(hwnd):
    MAX_CHARS = 257
    buffer = ctypes.create_unicode_buffer(MAX_CHARS)
    user32.GetWindowTextW(hwnd, buffer, MAX_CHARS)
    return buffer.value


def get_browser_hwnd(product_name):
    found = []

    @ctypes.WINFUNCTYPE(BOOL, HWND, LPARAM)
    def check_window_name(hwnd, lParam):  # noqa: N803
        window_name = name_from_hwnd(hwnd)
        if product_name not in window_name.lower():
            # EnumWindows should continue enumerating
            return True
        found.append(hwnd)
        # EnumWindows should stop enumerating (since we found the right window)
        return False

    user32.EnumWindows(check_window_name, LPARAM(0))
    if not found:
        raise LookupError(f"Couldn't find {product_name} HWND")
    return found[0]


def to_ia2(node):
    service = node.QueryInterface(IServiceProvider)
    return service.QueryService(IAccessible2._iid_, IAccessible2)  # noqa: F405


def find_browser(product_name):
    hwnd = get_browser_hwnd(product_name)
    root = accessible_object_from_window(hwnd)
    return to_ia2(root)


def poll_for_tab(url, root):
    tab = find_tab(url, root)
    while not tab:
        time.sleep(0.01)
        tab = find_tab(url, root)
    return tab


def find_tab(url, root):
    for i in range(1, root.accChildCount + 1):
        child = to_ia2(root.accChild(i))
        if child.accRole(CHILDID_SELF) == ROLE_SYSTEM_DOCUMENT:  # noqa: F405
            if child.accValue(CHILDID_SELF) == url:
                return child
            # No need to search within documents.
            return
        descendant = find_tab(url, child)
        if descendant:
            return descendant


def find_ia2_node(root, id):
    id_attribute = f"id:{id};"
    for i in range(1, root.accChildCount + 1):
        child = to_ia2(root.accChild(i))
        if child.attributes and id_attribute in child.attributes:
            return child
        descendant = find_ia2_node(child, id)
        if descendant:
            return descendant


def serialize_node(node):
    node_dictionary = {}
    node_dictionary["API"] = "windows"

    # MSAA properties
    node_dictionary["name"] = node.accName(CHILDID_SELF)
    node_dictionary["msaa_role"] = role_to_string[node.accRole(CHILDID_SELF)]  # noqa: F405
    node_dictionary["msaa_states"] = get_msaa_state_list(node.accState(CHILDID_SELF))  # noqa: F405

    # IAccessible2 properties
    node_dictionary["ia2_role"] = role_to_string[node.role()]  # noqa: F405
    node_dictionary["ia2_states"] = get_state_list(node.states)  # noqa: F405

    return node_dictionary


class WindowsAccessibilityExecutorImpl:
    def setup(self, product_name):
        self.product_name = product_name

    def test_accessibility_api(self, dom_id, test, api, url):
        """Execute a test of the accessibility API.

        :param dom_id: The dom id of the node to test.
        :param test: List of test statements.
        :param api: The API to test.
        :param url: The url of the test.
        """
        self.root = find_browser(self.product_name)
        if not self.root:
            raise Exception(f"Couldn't find browser {self.product_name}.")

        tab = poll_for_tab(url, self.root)
        node = find_ia2_node(tab, dom_id)
        if not node:
            raise Exception(f"Couldn't find node with ID {dom_id}.")

        results = []
        for test_statement in test:
            results.append("Fail: Test not implemented.")

        return results
