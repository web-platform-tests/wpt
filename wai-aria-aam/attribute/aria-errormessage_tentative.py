
TEST_HTML = '''<div role='checkbox' id='test' aria-errormessage='error1 error2' aria-invalid='true'>content</div>
<div id='error1'>hello</div>
<div id='error2'>world</div>'''

def test_atspi(atspi, session, inline):
    if not atspi:
        return

    session.url = inline(TEST_HTML)

    # Relation
    node = atspi.find_node('test', session.url)
    relations = atspi.get_relations_dictionary_helper(node)
    assert 'RELATION_ERROR_MESSAGE' in relations
    assert 'error1' in relations['RELATION_ERROR_MESSAGE']
    assert 'error2' in relations['RELATION_ERROR_MESSAGE']

    # Reverse Relation
    for error_id in ['error1', 'error2']:
        error_node = atspi.find_node(error_id, session.url)
        error_relations = atspi.get_relations_dictionary_helper(error_node)
        assert 'RELATION_ERROR_FOR' in error_relations
        assert 'test' in error_relations['RELATION_ERROR_FOR']


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
