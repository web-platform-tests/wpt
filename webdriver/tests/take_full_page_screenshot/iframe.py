import pytest
import base64

from tests.support.asserts import assert_success
from tests.support.image import png_dimensions
from tests.support.inline import iframe, inline

from six import ensure_binary

from . import full_page_dimensions
from . import take_full_page_screenshot

DEFAULT_CONTENT = "<div id='content'>Lorem ipsum dolor sit amet.</div>"

REFERENCE_CONTENT = "<div id='outer'>{}</div>".format(DEFAULT_CONTENT)
REFERENCE_STYLE = """
    <style>
      #outer {
        display: block;
        margin: 0;
        border: 0;
        width: 200px;
        height: 200px;
      }
      #content {
        display: block;
        margin: 0;
        border: 0;
        width: 100px;
        height: 100px;
        background: green;
      }
    </style>
"""

OUTER_IFRAME_STYLE = """
    <style>
      iframe {
        display: block;
        margin: 0;
        border: 0;
        width: 200px;
        height: 200px;
      }
    </style>
"""

INNER_IFRAME_STYLE = """
    <style>
      body {
        margin: 0;
      }
      div {
        display: block;
        margin: 0;
        border: 0;
        width: 100px;
        height: 100px;
        background: green;
      }
    </style>
"""

def test_always_captures_top_browsing_context(session):
    iframe_content = "{0}{1}".format(INNER_IFRAME_STYLE, DEFAULT_CONTENT)
    session.url = inline("""{0}{1}""".format(OUTER_IFRAME_STYLE, iframe(iframe_content)))

    response = take_full_page_screenshot(session)
    reference_screenshot = assert_success(response)
    assert png_dimensions(reference_screenshot) == full_page_dimensions(session)

    frame = session.find.css("iframe", all=False)
    session.switch_frame(frame)

    response = take_full_page_screenshot(session)
    screenshot = assert_success(response)

    assert png_dimensions(screenshot) == png_dimensions(reference_screenshot)
    assert screenshot == reference_screenshot

@pytest.mark.parametrize("domain", ["", "alt"], ids=["same_origin", "cross_origin"])
def test_source_origin(session, domain):
    session.url = inline("{0}{1}".format(REFERENCE_STYLE, REFERENCE_CONTENT))

    response = take_full_page_screenshot(session)
    reference_screenshot = assert_success(response)
    assert png_dimensions(reference_screenshot) == full_page_dimensions(session)

    iframe_content = "{0}{1}".format(INNER_IFRAME_STYLE, DEFAULT_CONTENT)
    session.url = inline("""{0}{1}""".format(
        OUTER_IFRAME_STYLE, iframe(iframe_content, domain=domain)))

    response = take_full_page_screenshot(session)
    screenshot = assert_success(response)
    assert png_dimensions(screenshot) == full_page_dimensions(session)
