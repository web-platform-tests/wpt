import pytest
from tests.support.asserts import assert_error, assert_success


def get_shadow_root(session, element):
    return session.transport.send(
        "GET", "session/{session_id}/element/{element_id}/shadow".format(
            session_id=session.session_id,
            element_id=element.id))


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
                                <div><input type="checkbox"/></div>
                            `;
                        }
                });
        </script>""")


def test_get_shadow_root(session, get_checkbox_dom):
    session.url = get_checkbox_dom
    custom_element = session.find.css("custom-checkbox-element", all=False)
    response = get_shadow_root(session, custom_element)
    assert_success(response)


def test_no_shadow_root(session, inline):
    session.url = inline("<div><p>no shadow root</p></div>")
    element = session.find.css("div", all=False)
    response = get_shadow_root(session, element)
    assert_error(response, "no such shadow root")
