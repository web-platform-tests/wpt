import pytest

from . import CARD, CARD_FORM, get_form_control_values

pytestmark = pytest.mark.asyncio


async def test_context(bidi_session, top_context, new_tab, load_form, get_element):
    await load_form(CARD_FORM)
    await load_form(CARD_FORM, context=new_tab)
    element = await get_element("#cc-number", context=new_tab)

    await bidi_session.autofill.trigger(
        context=new_tab["context"], element=element, card=CARD
    )

    values = await get_form_control_values(bidi_session, new_tab)
    assert values["cc-name"] == CARD["name"]
    assert values["cc-number"] == CARD["number"]

    # Make sure that the form in the other context is not filled.
    values = await get_form_control_values(bidi_session, top_context)
    assert values["cc-name"] == ""
    assert values["cc-number"] == ""


@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
async def test_iframe(bidi_session, new_tab, inline, get_element, domain):
    iframe_url = inline(CARD_FORM, domain=domain)
    await bidi_session.browsing_context.navigate(
        context=new_tab["context"],
        url=inline(f"<iframe src='{iframe_url}'></iframe>"),
        wait="complete",
    )

    contexts = await bidi_session.browsing_context.get_tree(root=new_tab["context"])
    iframe_context = contexts[0]["children"][0]
    element = await get_element("#cc-number", context=iframe_context)

    await bidi_session.autofill.trigger(
        context=iframe_context["context"], element=element, card=CARD
    )

    values = await get_form_control_values(bidi_session, iframe_context)
    assert values["cc-name"] == CARD["name"]
    assert values["cc-number"] == CARD["number"]
