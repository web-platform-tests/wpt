import pytest

from webdriver.bidi.error import (
    InvalidArgumentException,
    NoSuchFrameException,
    NoSuchNodeException,
)
from webdriver.bidi.modules.script import ContextTarget

from . import ADDRESS, ADDRESS_FORM, CARD, CARD_FORM

pytestmark = pytest.mark.asyncio

CARD_KEYS = ["number", "name", "expiryMonth", "expiryYear", "cvc"]


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_context_invalid_type(bidi_session, load_form, get_element, value):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(context=value, element=element, card=CARD)


async def test_params_context_invalid_value(bidi_session, load_form, get_element):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")

    with pytest.raises(NoSuchFrameException):
        await bidi_session.autofill.trigger(context="foo", element=element, card=CARD)


@pytest.mark.parametrize("value", [None, False, 42, "foo", []])
async def test_params_element_invalid_type(bidi_session, top_context, load_form, value):
    await load_form(CARD_FORM)

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=value, card=CARD
        )


async def test_params_element_invalid_shared_reference_value(
    bidi_session, top_context, load_form
):
    await load_form(CARD_FORM)

    with pytest.raises(NoSuchNodeException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element={"sharedId": "invalid"},
            card=CARD,
        )


async def test_params_element_from_other_context(
    bidi_session, top_context, new_tab, load_form, get_element
):
    await load_form(CARD_FORM)
    await load_form(CARD_FORM, context=new_tab)
    element = await get_element("#cc-number", context=new_tab)

    with pytest.raises(NoSuchNodeException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element, card=CARD
        )


@pytest.mark.parametrize(
    "expression",
    [
        "document.querySelector('form')",
        "document.querySelector('#not-a-control')",
        "document.querySelector('#not-a-control').firstChild",
    ],
    ids=["form", "div", "text node"],
)
async def test_params_element_not_form_control(
    bidi_session, top_context, load_form, expression
):
    await load_form(
        "<form><div id='not-a-control'>foo</div>"
        "<input autocomplete='cc-number'></form>"
    )
    node = await bidi_session.script.evaluate(
        expression=expression,
        target=ContextTarget(top_context["context"]),
        await_promise=False,
    )

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=node, card=CARD
        )


async def test_params_element_without_form_owner(
    bidi_session, top_context, load_form, get_element
):
    await load_form("<input id='cc-number' autocomplete='cc-number'>")
    element = await get_element("#cc-number")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element, card=CARD
        )


async def test_params_card_and_address(
    bidi_session, top_context, load_form, get_element
):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            card=CARD,
            address=ADDRESS,
        )


async def test_params_no_card_or_address(
    bidi_session, top_context, load_form, get_element
):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element
        )


@pytest.mark.parametrize("value", [None, False, 42, "foo", []])
async def test_params_card_invalid_type(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element, card=value
        )


@pytest.mark.parametrize("key", CARD_KEYS)
async def test_params_card_missing_field(
    bidi_session, top_context, load_form, get_element, key
):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")
    card = {k: v for k, v in CARD.items() if k != key}

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element, card=card
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
@pytest.mark.parametrize("key", CARD_KEYS)
async def test_params_card_field_invalid_type(
    bidi_session, top_context, load_form, get_element, key, value
):
    await load_form(CARD_FORM)
    element = await get_element("#cc-number")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            card={**CARD, key: value},
        )


@pytest.mark.parametrize("value", [None, False, 42, "foo", []])
async def test_params_address_invalid_type(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element, address=value
        )


async def test_params_address_fields_missing(
    bidi_session, top_context, load_form, get_element
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"], element=element, address={}
        )


@pytest.mark.parametrize("value", [None, False, 42, "foo", {}])
async def test_params_address_fields_invalid_type(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            address={"fields": value},
        )


@pytest.mark.parametrize("value", [None, False, 42, "foo", []])
async def test_params_address_field_invalid_type(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            address={"fields": [value]},
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_address_field_name_invalid_type(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            address={"fields": [{"name": value, "value": "John"}]},
        )


@pytest.mark.parametrize(
    "value", ["", "foo", "GIVEN-NAME", "NAME_FIRST", "cc-number"]
)
async def test_params_address_field_name_invalid_value(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            address={"fields": [{"name": value, "value": "John"}]},
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_address_field_value_invalid_type(
    bidi_session, top_context, load_form, get_element, value
):
    await load_form(ADDRESS_FORM)
    element = await get_element("#given-name")

    with pytest.raises(InvalidArgumentException):
        await bidi_session.autofill.trigger(
            context=top_context["context"],
            element=element,
            address={"fields": [{"name": "given-name", "value": value}]},
        )
