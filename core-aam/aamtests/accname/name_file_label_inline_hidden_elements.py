TEST_HTML = "<style> .hidden { display: none; } </style> <input type='file' id='test' /> <label for='test'> <span class='hidden'>1</span><span>2</span> <span style='visibility: hidden;'>3</span><span>4</span> <span hidden>5</span><span>6</span> <span aria-hidden='true'>7</span><span>8</span> <span aria-hidden='false' class='hidden'>9</span><span>10</span> </label>"
NAME = "2 46 810: No file chosen"

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
    assert titleUIElement != None
