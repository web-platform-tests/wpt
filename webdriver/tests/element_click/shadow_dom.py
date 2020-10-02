from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def element_click(session, element):
    return session.transport.send(
        "POST", "session/{session_id}/element/{element_id}/click".format(
            session_id=session.session_id,
            element_id=element.id))

def get_element_attribute(session, element, attr):
    return session.transport.send(
        "GET", "session/{session_id}/element/{element_id}/attribute/{attr}".format(
            session_id=session.session_id,
            element_id=element.id,
            attr=attr))

def get_checkbox_dom():
    return inline("""<custom-checkbox-element></custom-checkbox-element>
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

def test_shadow_element_click(session):
    session.url = get_checkbox_dom()
    element = session.find.css("custom-checkbox-element", all=False)
    response = element_click(session, element)
    assert_success(response)

def test_inside_element_click(session):
    session.url = get_checkbox_dom()
    shadow_root = session.find.css("custom-checkbox-element", all=False)
    element = session.execute_script("return arguments[0].shadowRoot.querySelector('input')", args=(shadow_root,))
    pre_checked = get_element_attribute(session, element, 'checked')
    assert pre_checked.body["value"] is None
    click_response = element_click(session, element)
    assert_success(click_response)
    post_checked = get_element_attribute(session, element, 'checked')
    assert post_checked.body["value"] == 'true'

def get_nested_shadow_checkbox_dom():
    return inline("""<custom-nested-checkbox-element></custom-nested-checkbox-element>
        <script>
         customElements.define('custom-nested-checkbox-element',
                class extends HTMLElement {
                    constructor() {
                            super();
                            this.attachShadow({mode: 'open'}).innerHTML = `
                                <div><custom-checkbox-element></custom-checkbox-element></div>
                            `;
                        }
                });
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

def test_nested_shadow_element_click(session):
    session.url = get_nested_shadow_checkbox_dom()
    element = session.find.css("custom-nested-checkbox-element", all=False)
    response = element_click(session, element)
    assert_success(response)

def test_inside_element_click(session):
    session.url = get_nested_shadow_checkbox_dom()
    shadow_root = session.find.css("custom-nested-checkbox-element", all=False)
    inner_shadow_root = session.execute_script("return arguments[0].shadowRoot.querySelector('custom-checkbox-element')", args=(shadow_root,))
    element = session.execute_script("return arguments[0].shadowRoot.querySelector('input')", args=(inner_shadow_root,))
    pre_checked = get_element_attribute(session, element, 'checked')
    assert pre_checked.body["value"] is None
    click_response = element_click(session, element)
    assert_success(click_response)
    post_checked = get_element_attribute(session, element, 'checked')
    assert post_checked.body["value"] == 'true'
