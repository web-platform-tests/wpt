TEST_HTML = "<input type='text' value='peanuts' id='ID1'> <input type='text' value='popcorn' id='ID2'> <input type='text' value='apple jacks' id='ID3'> <img id='test' aria-label='' aria-labelledby='test ID1 ID2 ID3' alt='' title='title' src='foo.jpg'/>"
NAME = "peanuts popcorn apple jacks"

def test_atspi_name_matches_chrome(atspi, session, inline):
    session.url = inline(TEST_HTML)
    node = atspi.find_node("test", session.url)
    assert atspi.Accessible.get_name(node) == NAME

def test_axapi_AXTitle_exposed(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    title = axapi.AXUIElementCopyAttributeValue(node, "AXTitle", None)[1]
    assert title != None and len(title)

def test_axapi_AXDescription_not_exposed(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    description = axapi.AXUIElementCopyAttributeValue(node, "AXDescription", None)[1]
    assert description == None or description == ""

def test_axapi_AXTitleUIElement_matches_safari(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    titleUIElement = axapi.AXUIElementCopyAttributeValue(node, "AXTitleUIElement", None)[1]
    assert titleUIElement != None
