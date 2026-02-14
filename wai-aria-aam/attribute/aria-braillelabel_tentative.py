
TEST_HTML = '<button id=test aria-braillelabel=foobar>'

def test_atspi(atspi, session, inline):
    if not atspi:
        return

    session.url = inline(TEST_HTML)

    node = atspi.find_node('test', session.url)
    assert "braillelabel:foobar" in atspi.Accessible.get_attributes_as_array(node)

def test_axapi(axapi, session, inline):
    if not axapi:
        return

    session.url = inline(TEST_HTML)

    # Todo: Add test for AX API.


def test_ia2(ia2, session, inline):
    if not ia2:
        return

    session.url = inline(TEST_HTML)

    # Todo: Add test for IA2.


def test_uia(uia, session, inline):
    if not uia:
        return

    session.url = inline(TEST_HTML)

    # Todo: Add test for UIA.
