import pytest
from tests.support.asserts import assert_success


def get_shadow_root(session, element):
    return session.transport.send(
        "POST", "session/{session_id}/element/{element_id}/shadow".format(
            session_id=session.session_id,
            element_id=element.id))


def find_elements(session, shadow_root, using, value):
    return session.transport.send(
        "POST", "session/{session_id}/shadow/{shadow_id}/elements".format(
            session_id=session.session_id,
            shadow_id=shadow_root.id),
        {"using": using, "value": value})


@pytest.fixture
def get_checkbox_dom(inline):
    return inline("""
        <style>
            custom-checkbox-element {
                display:block; width:20px; height:20px;
            }
        </style>
        <custom-checkbox-element></custom-checkbox-element>
        <script>
            customElements.define('custom-checkbox-element',
                class extends HTMLElement {
                    constructor() {
                            super();
                            this.attachShadow({mode: 'open'}).innerHTML = `
                                <div><input id="check" type="checkbox"/><input id="text"/></div>
                            `;
                        }
                });
        </script>""")


def test_find_element(session, get_checkbox_dom):
    session.url = get_checkbox_dom
    custom_element = session.find.css("custom-checkbox-element", all=False)
    shadow_root = get_shadow_root(session, custom_element).value
    response = find_elements(session, shadow_root, "css", "input")
    assert_success(response)
