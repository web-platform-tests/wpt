TEST_HTML = "<template id='template'> <button id='test'>one <slot aria-label='label' name='my-slot'></slot> three</button> </template> <my-element> <b slot='my-slot'>two</b> </my-element> <script> customElements.define( 'my-element', class extends HTMLElement { constructor() { super(); let template = document.getElementById('template'); let templateContent = template.content; const shadowRoot = this.attachShadow({mode: 'open'}) .appendChild(templateContent.cloneNode(true)); } } ); </script>"
NAME = "one two three"

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
