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

def get_button_dom():
    return inline(""" <custom-button-element></custom-button-element></div>
        <script>
            customElements.define('custom-button-element',
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
    session.url = get_button_dom()
    element = session.find.css("custom-button-element", all=False)
    response = element_click(session, element)
    assert_success(response)

def test_inside_element_click(session):
    session.url = get_button_dom()
    shadow_root = session.find.css("custom-button-element", all=False)
    element = session.execute_script("return arguments[0].shadowRoot.querySelector('input')", args=(shadow_root,))
    pre_checked = get_element_attribute(session, element, 'checked')
    assert_success(pre_checked, None)
    click_response = element_click(session, element)
    assert_success(click_response)
    post_checked = get_element_attribute(session, element, 'checked')
    assert_success(post_checked, 'true')

def get_custom_select_dom():
    return inline(""" <custom-select-element></custom-select-element> <div id="clicked">false</div>
        <script>
            customElements.define('custom-select-element',
                class extends HTMLElement {
                    constructor() {
                            super();
                            this.attachShadow({mode: 'open'}).innerHTML = `
                                <select>
                                    <option>first</option>
                                    <option>second</option>
                                </select>
                            `;                          
                        }
                });
        </script>""")

def test_shadow_option_element_click_inside(session):
    session.url = get_custom_select_dom()
    shadow_root = session.find.css("custom-select-element", all=False)
    options = session.execute_script("return arguments[0].shadowRoot.querySelectorAll('option');", args=(shadow_root,))

    assert options[0].selected
    assert not options[1].selected

    options[1].click()
    assert not options[0].selected
    assert options[1].selected