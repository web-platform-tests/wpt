import json

from webdriver.bidi.modules.script import ContextTarget

CARD = {
    "number": "4111111111111111",
    "name": "John Smith",
    "expiryMonth": "12",
    "expiryYear": "2040",
    "cvc": "123",
}

CARD_FORM = """
<form>
  <input id="cc-name" autocomplete="cc-name">
  <input id="cc-number" autocomplete="cc-number">
  <input id="cc-exp-month" autocomplete="cc-exp-month">
  <input id="cc-exp-year" autocomplete="cc-exp-year">
</form>
"""

ADDRESS = {
    "fields": [
        {"name": "given-name", "value": "John"},
        {"name": "family-name", "value": "Smith"},
        {"name": "address-line1", "value": "123 Main St"},
        {"name": "address-level2", "value": "San Francisco"},
        {"name": "address-level1", "value": "CA"},
        {"name": "postal-code", "value": "94102"},
        {"name": "country", "value": "US"},
    ]
}

ADDRESS_FORM = """
<form>
  <input id="given-name" autocomplete="given-name">
  <input id="family-name" autocomplete="family-name">
  <input id="address-line1" autocomplete="address-line1">
  <input id="address-level2" autocomplete="address-level2">
  <input id="address-level1" autocomplete="address-level1">
  <input id="postal-code" autocomplete="postal-code">
</form>
"""


async def get_form_control_values(bidi_session, context):
    """Returns the values of the form controls in `context`, keyed by id."""
    result = await bidi_session.script.evaluate(
        expression="""JSON.stringify(Object.fromEntries(
            [...document.querySelectorAll("input, select, textarea")]
                .map((control) => [control.id, control.value])))""",
        target=ContextTarget(context["context"]),
        await_promise=False,
    )
    return json.loads(result["value"])
