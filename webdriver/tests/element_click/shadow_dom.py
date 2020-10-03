from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

def element_click(session, element):
    return session.transport.send(
        "POST", "session/{session_id}/element/{element_id}/click".format(
            session_id=session.session_id,
            element_id=element.id))

def get_checkbox_dom():
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

def test_shadow_element_click(session):
    session.url = get_checkbox_dom()
    custom_element = session.find.css("custom-checkbox-element", all=False)
    is_pre_checked = session.execute_script("return arguments[0].shadowRoot.querySelector('input').checked", args=(custom_element,))
    assert is_pre_checked == False
    response = element_click(session, custom_element)
    assert_success(response)
    is_post_checked = session.execute_script("return arguments[0].shadowRoot.querySelector('input').checked", args=(custom_element,))
    assert is_post_checked == True


def test_inside_element_click(session):
    session.url = get_checkbox_dom()
    custom_element = session.find.css("custom-checkbox-element", all=False)
    checkbox_element = session.execute_script("return arguments[0].shadowRoot.querySelector('input')", args=(custom_element,))
    is_pre_checked = session.execute_script("return arguments[0].checked", args=(checkbox_element,))
    assert is_pre_checked == False
    click_response = element_click(session, checkbox_element)
    assert_success(click_response)
    is_post_checked = session.execute_script("return arguments[0].checked", args=(checkbox_element,))
    assert is_post_checked == True

def get_nested_shadow_checkbox_dom():
    return inline("""
        <style>
            custom-nested-checkbox-element {
                display:block; width:20px; height:20px;
            }
        </style>
        <custom-nested-checkbox-element></custom-nested-checkbox-element>
        <script>
         customElements.define('custom-nested-checkbox-element',
                class extends HTMLElement {
                    constructor() {
                            super();
                            this.attachShadow({mode: 'open'}).innerHTML = `
                                <style>
                                    custom-checkbox-element {
                                        display:block; width:20px; height:20px;
                                    }
                                </style>
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
    outer_custom_element = session.find.css("custom-nested-checkbox-element", all=False)
    inner_custom_element = session.execute_script("return arguments[0].shadowRoot.querySelector('custom-checkbox-element')", args=(outer_custom_element,))
    is_pre_checked = session.execute_script("return arguments[0].shadowRoot.querySelector('input').checked", args=(inner_custom_element,))
    assert is_pre_checked == False
    response = element_click(session, outer_custom_element)
    assert_success(response)
    is_post_checked = session.execute_script("return arguments[0].shadowRoot.querySelector('input').checked", args=(inner_custom_element,))
    assert is_post_checked == True

def test_nested_shadow_element_click_inner(session):
    session.url = get_nested_shadow_checkbox_dom()
    outer_custom_element = session.find.css("custom-nested-checkbox-element", all=False)
    inner_custom_element = session.execute_script("return arguments[0].shadowRoot.querySelector('custom-checkbox-element')", args=(outer_custom_element,))
    is_pre_checked = session.execute_script("return arguments[0].shadowRoot.querySelector('input').checked", args=(inner_custom_element,))
    assert is_pre_checked == False
    response = element_click(session, inner_custom_element)
    assert_success(response)
    is_post_checked = session.execute_script("return arguments[0].shadowRoot.querySelector('input').checked", args=(inner_custom_element,))
    assert is_post_checked == True

def test_inside_nested_element_click_checkbox(session):
    session.url = get_nested_shadow_checkbox_dom()
    outer_custom_element = session.find.css("custom-nested-checkbox-element", all=False)
    inner_custom_element = session.execute_script("return arguments[0].shadowRoot.querySelector('custom-checkbox-element')", args=(outer_custom_element,))
    checkbox_element = session.execute_script("return arguments[0].shadowRoot.querySelector('input')", args=(inner_custom_element,))
    is_pre_checked = session.execute_script("return arguments[0].checked", args=(checkbox_element,))
    assert is_pre_checked == False
    click_response = element_click(session, checkbox_element)
    assert_success(click_response)
    is_post_checked = session.execute_script("return arguments[0].checked", args=(checkbox_element,))
    assert is_post_checked == True
