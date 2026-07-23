TEST_HTML = "<style> .hidden { display: none; } </style> <div id='test' role='link' tabindex='0'> <span aria-hidden='true'><i> Hello, </i></span> <span>My</span> name is <div><img src='file.jpg' title='Bryan' alt='' role='presentation' /></div> <span role='presentation' aria-label='Eli'><span aria-label='Garaventa'>Zambino</span></span> <span>the weird.</span> (QED) <span class='hidden'><i><b>and don't you forget it.</b></i></span> </div>"
NAME = "My name is Eli the weird. (QED)"

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
