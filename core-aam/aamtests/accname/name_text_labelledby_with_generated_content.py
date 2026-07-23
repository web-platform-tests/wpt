TEST_HTML = "<style type='text/css'> p::before { content: 'one'; } p::after { content: 'three'; } </style> <input id='test' type='text' aria-labelledby='ID1 ID2'> <p id='ID1'>two</p> <p id='ID2' hidden>four</p>"
NAME = "onetwothree four"

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

def test_axapi_AXTitleUIElement_exposed(axapi, session, inline):
    session.url = inline(TEST_HTML)
    node = axapi.find_node("test", session.url)
    titleUIElement = axapi.AXUIElementCopyAttributeValue(node, "AXTitleUIElement", None)[1]
    assert titleUIElement != None
