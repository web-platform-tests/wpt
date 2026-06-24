from __future__ import annotations

from typing import Any, Optional

import comtypes
import comtypes.client

from .api_wrapper import ApiWrapper

comtypes.CoInitialize()

# Type alias for the dynamically generated UI Automation element interface.
UiaElement = Any

# Load the UI Automation type library. This exposes the IUIAutomation
# interface, the CUIAutomation coclass, and the UIA_* property, control type,
# pattern, and tree scope id constants.
UIA = comtypes.client.GetModule("UIAutomationCore.dll")

# The IUIAutomation entry point, used to obtain the root element, create
# property conditions, and walk the tree.
_automation = comtypes.client.CreateObject(
    UIA.CUIAutomation, interface=UIA.IUIAutomation
)

# ----  Maps for turning UIA constants into human readable names.

# Generate a mapping of control type id to human readable name, e.g. 50000 -> "Button", 50001 -> "Calendar", etc.
UIA_CONTROL_TYPE_MAP = {
    value: name[len("UIA_"):-len("ControlTypeId")]
    for name, value in vars(UIA).items()
    if name.startswith("UIA_") and name.endswith("ControlTypeId")
}

# Generate a mapping of property id to human readable name, e.g. 30000 -> "AutomationId", 30001 -> "Name", etc.
UIA_PROPERTY_ID_MAP = {
    value: name[len("UIA_"):-len("PropertyId")]
    for name, value in vars(UIA).items()
    if name.startswith("UIA_") and name.endswith("PropertyId")
}
UIA_PROPERTY_NAME_MAP = {name: value for value, name in UIA_PROPERTY_ID_MAP.items()}

# Generate a mapping of event id to human readable name, e.g. 20000 -> "AutomationFocusChangedEvent", 20001 -> "AutomationPropertyChangedEvent", etc.
UIA_EVENT_ID_MAP = {
    value: name[len("UIA_"):-len("EventId")]
    for name, value in vars(UIA).items()
    if name.startswith("UIA_") and name.endswith("EventId")
}

# Generate a mapping of pattern id to human readable name, e.g. 10000 -> "InvokePattern", 10001 -> "SelectionPattern", etc.
UIA_PATTERN_ID_MAP = {
    value: name[len("UIA_"):-len("PatternId")]
    for name, value in vars(UIA).items()
    if name.startswith("UIA_") and name.endswith("PatternId")
}

# Generate a mapping of landmark type id to human readable name, e.g. 8000 -> "Custom", 80001 -> "Form", etc.
UIA_LANDMARK_TYPE_ID_MAP = {
    value: name[len("UIA_"):-len("LandmarkTypeId")]
    for name, value in vars(UIA).items()
    if name.startswith("UIA_") and name.endswith("LandmarkTypeId")
}

class UiaWrapper(ApiWrapper[UiaElement]):

    @property
    def api_name(self) -> str:
        return "UIA"

    def find_node(self, dom_id: str, url: str) -> UiaElement:
        """
        :param dom_id: The dom id of the node to test.
        :param url: The url of the test.
        """
        if self.test_url != url or not self.document:
            self.test_url = url
            self.document = self._poll_for(
                self._find_tab,
                f"Timeout looking for url: {self.test_url}",
            )

        test_node = self._poll_for(
            lambda: self._find_node_by_id(self.document, dom_id),
            f"Timeout looking for node with id {dom_id} in accessibility API UIA.",
        )

        return test_node

    def get_control_type(self, element: UiaElement) -> str:
        """
        :param element: The element to read from.
        :returns: The human readable UIA control type name, e.g. "Button" or "Group".
        """
        return UIA_CONTROL_TYPE_MAP.get(element.CurrentControlType, str(element.CurrentControlType))

    def get_landmark_type(self, element: UiaElement) -> str:
        """
        :param element: The element to read from.
        :returns: The human readable UIA landmark type name, e.g. "Custom" or "Form".
        """
        landmark_type = self.get_property(element, "LandmarkType")
        return UIA_LANDMARK_TYPE_ID_MAP.get(landmark_type, str(landmark_type))

    def get_property(self, element: UiaElement, property_name: str) -> Any:
        """Read a UIA property by human readable name, e.g. "LocalizedControlType".

        :param element: The element to read from.
        :param property_name: The human readable name of the property, e.g.
            "LocalizedControlType".
        :returns: The current value of the property.
        """
        property_id = UIA_PROPERTY_NAME_MAP.get(property_name)
        if property_id is None:
            raise ValueError(f"Unknown UIA property name: {property_name}")
        return element.GetCurrentPropertyValue(property_id)

    def get_supported_patterns(self, element: UiaElement) -> list[str]:
        """returns an array of human readable supportable patterns for the element.

        :param element: The element to read from.
        :returns: array of human readable supported patterns
        """
        supported_patterns = []

        for pattern_id, pattern_name in UIA_PATTERN_ID_MAP.items():
            try:
                # Native COM returns a valid pointer object if supported.
                # If NOT supported, the native layer throws an HRESULT/COMError.
                pattern_obj = element.GetCurrentPattern(pattern_id)

                if pattern_obj:
                    supported_patterns.append(pattern_name)
            except comtypes.COMError:
                # Native UIA explicitly fails with an error code if the control doesn't support the pattern.
                continue
        return supported_patterns

    def get_pattern_attr(
        self, element: UiaElement, pattern: str
    ) -> Optional[dict[str, Any]]:
        """Return selected attributes for a supported pattern on the element.

        :param element: The element to query.
        :param pattern: The human readable pattern name, e.g. "InvokePattern".
        :returns: A dictionary of selected pattern attributes, or None if unsupported.
        """
        pattern_id = next(
            (id for id, name in UIA_PATTERN_ID_MAP.items() if name == pattern),
            None,
        )

        if pattern_id is None:
            raise ValueError(f"Unknown UIA pattern name: {pattern}")

        try:
            pattern_obj = element.GetCurrentPattern(pattern_id)

            if not pattern_obj:
                return None

            if pattern_id == UIA.UIA_TogglePatternId:
                toggle_pattern = pattern_obj.QueryInterface(
                    UIA.IUIAutomationTogglePattern
                )
                return {"ToggleState": toggle_pattern.CurrentToggleState}

            if pattern_id == UIA.UIA_SelectionItemPatternId:
                selection_pattern = pattern_obj.QueryInterface(
                    UIA.IUIAutomationSelectionItemPattern
                )
                return {"IsSelected": selection_pattern.CurrentIsSelected}

            if pattern_id == UIA.UIA_TextPatternId:
                text_pattern = pattern_obj.QueryInterface(
                    UIA.IUIAutomationTextPattern
                )
                text_range = text_pattern.DocumentRange
                return {
                    "IsSuperscript": text_range.GetAttributeValue(
                        UIA.UIA_IsSuperscriptAttributeId
                    ),
                    "IsSubscript": text_range.GetAttributeValue(
                        UIA.UIA_IsSubscriptAttributeId
                    ),
                }
        except comtypes.COMError:
            return None

        return None

    def _find_browser(self) -> Optional[UiaElement]:
        """Find the UIA element representing the browser's top level window.

        :return: The browser element or None.
        """
        if self.pid and self.pid != 0:
            return self._find_browser_by_pid()
        return self._find_browser_by_name()

    def _find_browser_by_pid(self) -> Optional[UiaElement]:
        """Find the browser window by matching the process id.

        :return: The browser element or None.
        """
        root = _automation.GetRootElement()
        condition = _automation.CreatePropertyCondition(
            UIA.UIA_ProcessIdPropertyId, self.pid
        )
        return root.FindFirst(UIA.TreeScope_Children, condition)

    def _find_browser_by_name(self) -> Optional[UiaElement]:
        """Find the browser window by matching the product name.

        Used when no pid is available (e.g. servo passes pid 0).

        :return: The browser element or None.
        """
        root = _automation.GetRootElement()
        walker = _automation.ControlViewWalker
        element = walker.GetFirstChildElement(root)
        while element:
            name = element.CurrentName or ""
            if self.product_name.lower() in name.lower():
                return element
            element = walker.GetNextSiblingElement(element)
        return None

    def _find_tab(self) -> Optional[UiaElement]:
        """Find the document with the test url.

        :return: The element representing the test document or None.
        """
        condition = _automation.CreatePropertyCondition(
            UIA.UIA_ControlTypePropertyId, UIA.UIA_DocumentControlTypeId
        )
        documents = self.root.FindAll(UIA.TreeScope_Descendants, condition)
        for i in range(documents.Length):
            document = documents.GetElement(i)
            if self._document_url(document) == self.test_url:
                return document
        return None

    def _document_url(self, document: UiaElement) -> Optional[str]:
        """Return the url of a document element.

        Browsers expose the document url via the UIA Value property, mirroring
        IAccessible2's accValue on the document.

        :param document: A document control element.
        :return: The url string or None.
        """
        return document.GetCurrentPropertyValue(UIA.UIA_ValueValuePropertyId)

    def _find_node_by_id(
        self, root: UiaElement, dom_id: str
    ) -> Optional[UiaElement]:
        """Find the UIA element with a specified dom_id.

        Browsers expose the DOM id via the UIA AutomationId property.

        :param root: The root node to search from.
        :param dom_id: The DOM id.
        :return: The element or None if not found.
        """
        condition = _automation.CreatePropertyCondition(
            UIA.UIA_AutomationIdPropertyId, dom_id
        )
        return root.FindFirst(UIA.TreeScope_Descendants, condition)
