@pytest.fixture
def get_shadow_page(inline):
    def get_shadow_page(shadow_content):
        return inline("""
            <custom-shadow-element></custom-shadow-element>
            <script>
                customElements.define('custom-shadow-element',
                    class extends HTMLElement {{
                        constructor() {{
                                super();
                                this.attachShadow({{mode: 'open'}}).innerHTML = `
                                    {{ {0} }}
                                `;
                            }}
                    }});
            </script>""".format(shadow_content))
    return get_shadow_page


@pytest.fixture
def check_user_prompt_closed_without_exception(session, create_dialog, get_shadow_page):
    def check_user_prompt_closed_without_exception(dialog_type, retval):
        session.url = get_shadow_page("<div><p>bar</p><div>")
        outer_element = session.find.css("custom-shadow-element", all=False)
        shadow_root = outer_element.shadow_root
        inner_element = session.execute_script("return arguments[0].shadowRoot.querySelector('p')",
                                               args=(outer_element,))

        create_dialog(dialog_type, text=dialog_type)

        response = find_element(session, shadow_root.id, "css selector", "p")
        value = assert_success(response)

        assert_dialog_handled(session, expected_text=dialog_type, expected_retval=retval)

        assert_same_element(session, value, inner_element)

    return check_user_prompt_closed_without_exception


@pytest.fixture
def check_user_prompt_closed_with_exception(session, create_dialog, get_shadow_page):
    def check_user_prompt_closed_with_exception(dialog_type, retval):
        session.url = get_shadow_page("<div><p>bar</p><div>")
        outer_element = session.find.css("custom-shadow-element", all=False)
        shadow_root = outer_element.shadow_root

        create_dialog(dialog_type, text=dialog_type)

        response = find_element(session, shadow_root.id, "css selector", "p")
        assert_error(response, "unexpected alert open")

        assert_dialog_handled(session, expected_text=dialog_type, expected_retval=retval)

    return check_user_prompt_closed_with_exception


@pytest.fixture
def check_user_prompt_not_closed_but_exception(session, create_dialog, get_shadow_page):
    def check_user_prompt_not_closed_but_exception(dialog_type):
        session.url = get_shadow_page("<div><p>bar</p><div>")
        outer_element = session.find.css("custom-shadow-element", all=False)
        shadow_root = outer_element.shadow_root

        create_dialog(dialog_type, text=dialog_type)

        response = find_element(session, shadow_root.id, "css selector", "p")
        assert_error(response, "unexpected alert open")

        assert session.alert.text == dialog_type
        session.alert.dismiss()

    return check_user_prompt_not_closed_but_exception
