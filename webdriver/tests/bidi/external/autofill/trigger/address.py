import pytest

from . import ADDRESS, ADDRESS_FORM, get_form_control_values

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("selector", ["#given-name", "#postal-code"])
async def test_address(bidi_session, top_context, load_form, get_element, selector):
    await load_form(ADDRESS_FORM)
    element = await get_element(selector)

    result = await bidi_session.autofill.trigger(
        context=top_context["context"], element=element, address=ADDRESS
    )
    assert result == {}

    values = await get_form_control_values(bidi_session, top_context)
    assert values["given-name"] == "John"
    assert values["family-name"] == "Smith"
    assert values["address-line1"] == "123 Main St"
    assert values["address-level2"] == "San Francisco"
    assert values["postal-code"] == "94102"
