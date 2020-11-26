from tests.support.asserts import assert_error, assert_png, assert_success
from tests.support.image import png_dimensions
from tests.support.inline import inline

from . import full_page_dimensions
from . import take_full_page_screenshot

def test_no_top_browsing_context(session, closed_window):
    response = take_full_page_screenshot(session)
    assert_error(response, "no such window")


def test_no_browsing_context(session, closed_frame):
    session.url = inline("<input>")

    response = take_full_page_screenshot(session)
    value = assert_success(response)

    assert_png(value)
    assert png_dimensions(value) == full_page_dimensions(session)


def test_format_and_dimensions(session):
    session.url = inline("<input>")

    response = take_full_page_screenshot(session)
    value = assert_success(response)

    assert_png(value)
    assert png_dimensions(value) == full_page_dimensions(session)
