import pytest


@pytest.fixture
def load_form(bidi_session, top_context, inline):
    async def load_form(form, context=top_context):
        await bidi_session.browsing_context.navigate(
            context=context["context"], url=inline(form), wait="complete"
        )

    return load_form
