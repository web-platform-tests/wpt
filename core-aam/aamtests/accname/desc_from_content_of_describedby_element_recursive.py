TEST_HTML = "<label for='test'>Label text</label> <input id='test' type='text' aria-describedby='desc2'> <div id='desc2'> <div role='status'> Description text </div> </div>"
NAME = "Label text"
DESCRIPTION = "Description text"

def test_atspi_name(atspi, session, inline):
    session.url = inline(TEST_HTML)
    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_name(node) == NAME

def test_atspi_description(atspi, session, inline):
    session.url = inline(TEST_HTML)
    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_description(node) == DESCRIPTION

def test_axapi_AXTitle(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    title = axapi.AXUIElementCopyAttributeValue(node, "AXTitle", None)[1]
    assert title == NAME

# TODO: Add an AXAPI test to test description in AXCustomContent.

def test_axapi_AXTitleUIElement(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    titleUIElement = axapi.AXUIElementCopyAttributeValue(node, "AXTitleUIElement", None)[1]
    assert titleUIElement != None
