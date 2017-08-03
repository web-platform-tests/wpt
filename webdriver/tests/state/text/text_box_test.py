import pytest

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

# These tests are derived from the Selenium project's JS tests found
# at //javascript/atoms/test/text_box_test.html The name of this file
# matches this for easy reference.

def header():
    return """
     <style><!--
            div.example { width: 25em; }
            div.example div.red {
              margin: 0 0.5em 0.5em 0.5em;
              padding: 0.5em;
            }
            div.example div.header {
              margin: 0 0.5em;
              padding: 0;
              font-style: italic;
              color: gray;
            }
            .red { border: 1px solid #c00; }                                                                                                                                           
            .green { border: 1px solid #0c0;}                                                                                                                                          
            .blue { border: 1px solid #00c;}                                                                                                                                           
        --></style><body>"""


def test_block(session):
    session.url = inline(header() +
       '<div id="block"><div class="red">pre<div class="green" style="display: block;">div.block</div>mid<span class="blue" style="display: block;">span.block</span>post</div></div>')
    element = session.find.css("#block", all=False)

    assert element.text == (
        "pre\n"
        "div.block\n"
        "mid\n"
        "span.block\n"
        "post")


def test_inline(session):
    session.url = inline(header() + 
        '<div id="inline"><div class="red">pre-<div class="green" style="display: inline;">div.inline</div>-mid-<span class="blue">span.inline</span>-post</div></div>')
    element = session.find.css("#inline", all=False)

    assert element.text == "pre-div.inline-mid-span.inline-post"


def test_inline_between_two_blocks(session):
    session.url = inline(header() +
        '<div id="inline"><div class="red">display:block <div class="green" style="display: inline;">display:inline</div><div class="blue" style="display: block;">display:block</div><div class="green" style="display: inline;">display:inline</div></div></div>')
    element = session.find.css("#inline", all=False)

    assert element.text == "display:block display:inline\ndisplay:block\ndisplay:inline"


def test_none(session):
    session.url = inline(header() +
        '<div id="none"><div class="red">pre-<div class="green" style="display: none;">div.none</div>-mid-<span class="blue" style="display: none;">span.none</span>-post</div></div>')
    element = session.find.css("#none", all=False)

    assert element.text == "pre--mid--post"


def test_inline_block(session):
    session.url = inline(header() +
        '<div id="block"><div class="red">pre-<div class="green" style="display: inline-block;">a</div>-mid-<span class="blue" style="display: inline-block;">b</span>-post</div></div>')
    element = session.find.css("#block", all=False)

    assert element.text == "pre-a-mid-b-post"


def test_list_item(session):
    session.url = inline(header() +
        '<div id="list"><div class="red">pre-<div class="green" style="display: list-item;">a</div>-mid-<span class="blue" style="display: list-item;">b</span>-post</div></div>')
    element = session.find.css("#list", all=False)

    assert element.text == "pre-\na\n-mid-\nb\n-post"


def test_runin_followed_by_float(session):
    session.url = inline(header() +
        '<div id="runin"><div class="red"><h3 class="green">Hello</h3><div class="blue" style="float: right; width: 50%; clear: right;">, world.</div></div></div>')
    element = session.find.css("#runin", all=False)

    assert element.text == "Hello\n, world."
