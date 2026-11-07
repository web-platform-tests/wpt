# META: timeout=long

import pytest

from webdriver.bidi.error import UnsupportedOperationException

from . import ADDRESS, ADDRESS_FIELD_VALUES, ADDRESS_FORM, get_form_control_values

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
    assert values == {
        "given-name": "John",
        "family-name": "Smith",
        "address-line1": "123 Main St",
        "address-level2": "San Francisco",
        "address-level1": "CA",
        "postal-code": "94102",
    }


async def test_address_other_form(bidi_session, top_context, load_form, get_element):
    await load_form(
        ADDRESS_FORM
        + "<form><input id='other-given-name' autocomplete='given-name'></form>"
    )
    element = await get_element("#given-name")

    result = await bidi_session.autofill.trigger(
        context=top_context["context"], element=element, address=ADDRESS
    )
    assert result == {}

    # Make sure that only the element's form owner is filled.
    values = await get_form_control_values(bidi_session, top_context)
    assert values == {
        "given-name": "John",
        "family-name": "Smith",
        "address-line1": "123 Main St",
        "address-level2": "San Francisco",
        "address-level1": "CA",
        "postal-code": "94102",
        "other-given-name": "",
    }


@pytest.mark.parametrize("name", list(ADDRESS_FIELD_VALUES))
async def test_address_field_name(
    bidi_session, top_context, load_form, get_element, name
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    try:
        result = await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            address={"fields": [{"name": name, "value": ADDRESS_FIELD_VALUES[name]}]},
        )
    except UnsupportedOperationException:
        # The user agent does not support filling this field.
        return
    assert result == {}


async def test_address_empty_fields(bidi_session, top_context, load_form, get_element):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    result = await bidi_session.autofill.trigger(
        context=top_context["context"], element=element, address={"fields": []}
    )
    assert result == {}

    values = await get_form_control_values(bidi_session, top_context)
    assert values == {
        "given-name": "",
        "family-name": "",
        "address-line1": "",
        "address-level2": "",
        "address-level1": "",
        "postal-code": "",
    }
