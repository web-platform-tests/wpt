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


@pytest.fixture
def check_user_prompt_closed_without_exception(session, create_dialog, get_checkbox_dom):
    def check_user_prompt_closed_without_exception(dialog_type, retval):
        session.url = get_checkbox_dom
        element = session.find.css("custom-checkbox-element", all=False)

        create_dialog(dialog_type, text=dialog_type)

        response = get_shadow_root(session, element.id)
        value = assert_success(response)
        assert isinstance(value, dict)
        assert "shadow-075b-4da1-b6ba-e579c2d3230a" in dict

        assert_dialog_handled(session, expected_text=dialog_type, expected_retval=retval)

    return check_user_prompt_closed_without_exception


@pytest.fixture
def check_user_prompt_closed_with_exception(session, create_dialog, get_checkbox_dom):
    def check_user_prompt_closed_with_exception(dialog_type, retval):
        session.url = get_checkbox_dom
        element = session.find.css("custom-checkbox-element", all=False)

        create_dialog(dialog_type, text=dialog_type)

        response = get_shadow_root(session, element.id)
        assert_error(response, "unexpected alert open")

        assert_dialog_handled(session, expected_text=dialog_type, expected_retval=retval)

    return check_user_prompt_closed_with_exception


@pytest.fixture
def check_user_prompt_not_closed_but_exception(session, create_dialog, get_checkbox_dom):
    def check_user_prompt_not_closed_but_exception(dialog_type):
        session.url = get_checkbox_dom
        element = session.find.css("custom-checkbox-element", all=False)

        create_dialog(dialog_type, text=dialog_type)

        response = get_shadow_root(session, element.id)
        assert_error(response, "unexpected alert open")

        assert session.alert.text == dialog_type
        session.alert.dismiss()

    return check_user_prompt_not_closed_but_exception
