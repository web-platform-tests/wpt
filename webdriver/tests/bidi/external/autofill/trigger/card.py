import pytest

from . import CARD, CARD_FORM, get_form_control_values

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("selector", ["#cc-number", "#cc-name"])
async def test_card(bidi_session, top_context, load_form, get_element, selector):
    await load_form(CARD_FORM)
    element = await get_element(selector)

    result = await bidi_session.autofill.trigger(
        context=top_context["context"], element=element, card=CARD
    )
    assert result == {}

    values = await get_form_control_values(bidi_session, top_context)
    assert values["cc-name"] == CARD["name"]
    assert values["cc-number"] == CARD["number"]
