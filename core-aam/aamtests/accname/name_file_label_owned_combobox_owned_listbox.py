TEST_HTML = "<input type='file' id='test' /><label for='test'>Flash <span aria-owns='id1'>the screen</span> times.</label><div><div id='id1' role='combobox' aria-owns='id2'><div role='textbox'></div></div></div><div><ul id='id2' role='listbox' style='list-style-type: none;'><li role='option' >1 </li><li role='option' aria-selected='true'>2 </li><li role='option'>3 </li></ul></div>"
NAME = "Flash the screen 2 times.: No file chosen"

def test_atspi_name(atspi, session, inline):
    session.url = inline(TEST_HTML)
    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_name(node) == NAME

def test_axapi_AXTitle(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    title = axapi.AXUIElementCopyAttributeValue(node, "AXTitle", None)[1]
    assert title == NAME

def test_axapi_AXDescription(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    description = axapi.AXUIElementCopyAttributeValue(node, "AXDescription", None)[1]
    assert description == None or description == ""

def test_axapi_AXTitleUIElement(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    titleUIElement = axapi.AXUIElementCopyAttributeValue(node, "AXTitleUIElement", None)[1]
    assert titleUIElement == None
