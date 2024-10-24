import asyncio

import pytest
import webdriver.bidi.error as error

from ... import any_string

pytestmark = pytest.mark.asyncio


async def test_interactive_change_location_throws(bidi_session, inline,
      new_tab):
    new_url = inline("<div>foo</div>")
    url_with_redirect = inline(f"<script>window.location='{new_url}';</script>")
    with pytest.raises(error.UnknownErrorException):
        await bidi_session.browsing_context.navigate(
            context=new_tab["context"], url=url_with_redirect,
            wait="interactive")


async def test_interactive_change_location_succeeded(bidi_session, inline,
      new_tab):
    new_url = inline("<div>foo</div>")
    url_with_redirect = inline(f"<script>window.location='{new_url}';</script>")
    result = await bidi_session.browsing_context.navigate(
        context=new_tab["context"], url=url_with_redirect, wait="interactive")

    any_string(result["navigation"])
    assert result["url"] == new_url
