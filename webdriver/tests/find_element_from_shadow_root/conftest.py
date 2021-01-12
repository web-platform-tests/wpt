@pytest.fixture
def test_shadow_page(inline, shadow_content):
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
