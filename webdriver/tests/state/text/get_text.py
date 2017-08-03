import pytest
import uuid

from tests.support.asserts import assert_error, assert_success
from tests.support.inline import inline

# For failing tests, the Get Element Text end-point is used
# directly. In all other cases, the Element.text() function is used.

def test_getting_text_of_a_non_existant_element_is_an_error(session):
   session.url = inline("""<body>Hello world</body>""")
   id = uuid.uuid4()

   result = session.transport.send(
       "GET",
       "session/%s/element/%s/text" % (session.session_id, id))
   assert_error(result, "no such element")


def test_read_element_text(session):
    session.url = inline("""
        <body>
          Noise before <span id='id'>This has an ID</span>. Noise after
        </body>""")
    element = session.find.css("#id", all=False)
    assert element.text == "This has an ID"

def test_get_visible_text_should_return_one_line_text(session):
    session.url = inline('<body><p id="oneline">A single line of text</p>')
    element = session.find.css("#oneline", all=False)

    assert element.text == "A single line of text"

def test_get_visible_text_should_return_multiline_text(session):
    session.url = inline("""<body>
      <div id="multiline">
        <div>
          <p>A div containing</p>
            More than one line of text<br/>

          <div>and block level elements</div>
        </div>
      </div>""")
    element = session.find.css("#multiline", all=False)

    assert "A div containing" in element.text
    assert "More than one line of text" in element.text
    assert "and block level elements" in element.text

def test_should_ignore_script_elements(session):
    session.url = inline("""<body><p id="script">Some text<script>function shouldIgnoreMe() {}</script> that contains script tags</p>""")
    element = session.find.css("#script", all=False)
    assert element.text == "Some text that contains script tags"

def test_should_ignore_title_elements(session):
    session.url = inline("""<html><head><title>I like cake</title><body>""")
    element = session.find.css("title", all=False)
    assert element.text == ""

def test_should_recursively_ignore_title_element(session):
    session.url = inline("""<html><head><title>I also like cheese</title><body>""")
    element = session.find.css("head", all=False)
    assert element.text == ""

def test_represents_a_block_level_element_as_a_newline(session):
    session.url = inline("""<body>
        <div id="multiline">
          <div>
            <p>A div containing</p>
            More than one line of text<br/>

            <div>and block level elements</div>
          </div>
        </div>""")
    element = session.find.css("#multiline", all=False)
    assert element.text.startswith("A div containing\n")
    assert "More than one line of text\n" in element.text
    assert element.text.endswith("and block level elements")

def test_collapses_multiple_whitespaces_into_a_single_space(session):
    session.url = inline("""<body>
        <p id="lotsofspaces">This line has lots

            of spaces.
        </p>""")
    element = session.find.css("#lotsofspaces", all=False)
    assert element.text == "This line has lots of spaces."

def test_converts_non_breaking_space_into_a_space(session):
    session.url = inline("""<body><p id="nbsp">This line has a&nbsp;non-breaking space</p>""")
    element = session.find.css("#nbsp", all=False)
    assert element.text == "This line has a non-breaking space"

def test_should_not_collapse_non_breaking_spaces(session):
    session.url = inline("""<body><p id="nbspandspaces">This line has a &nbsp; non-breaking space and spaces</p>""")
    element = session.find.css("#nbspandspaces", all=False)
    assert element.text == "This line has a   non-breaking space and spaces"

def test_should_not_trim_trailing_non_breaking_spaces(session):
    session.url = inline("""<p id="trailingnbsp">This line has trailing non-breaking spaces&nbsp;&nbsp;&nbsp;</p>""")
    element = session.find.css("#trailingnbsp", all=False)
    assert element.text == "This line has trailing non-breaking spaces   "

def test_should_not_trim_non_breaking_spaces_at_the_end_of_a_line_in_the_middle_of_text(session):
    session.url = inline("""<p id="multilinetrailingnbsp">These lines &nbsp<br />&nbsp have leading and trailing NBSPs&nbsp;&nbsp;</p>""")
    element = session.find.css("#multilinetrailingnbsp", all=False)
    assert element.text.startswith("These lines  \n")
    
def test_should_not_trim_non_breaking_spaces_at_the_start_of_a_line_in_the_middle_of_text(session):
    session.url = inline("""<p id="multilinetrailingnbsp">These lines &nbsp<br />&nbsp have leading and trailing NBSPs&nbsp;&nbsp;</p>""")
    element = session.find.css("#multilinetrailingnbsp", all=False)
    assert "\n  have" in element.text

def test_should_not_trim_trailing_non_breaking_spaces_in_multiline_text(session):
    session.url = inline("""<p id="multilinetrailingnbsp">These lines &nbsp<br />&nbsp have leading and trailing NBSPs&nbsp;&nbsp;</p>""")
    element = session.find.css("#multilinetrailingnbsp", all=False)
    assert element.text.endswith("trailing NBSPs  ")

def test_inline_elements_should_not_affect_returned_text(session):
    session.url = inline("""
        <p id="inline">This <span id="inlinespan">    line has <em>text</em>  </span> within elements that are meant to be displayed
        <!-- not as a block but --> inline</p>""")
    element = session.find.css("#inline", all=False)
    assert element.text ==  (
        "This line has text within elements that are meant"
        " to be displayed inline")

def test_should_return_the_entire_text_of_inline_elements(session):
    session.url = inline("""<span id="span">An inline element</span>""")
    element = session.find.css("#span", all=False)
    assert element.text == "An inline element"

def test_should_return_empty_string_when_text_is_only_spaces(session):
    session.url = inline("""<p id="spaces">        </p>""")
    element = session.find.css("#spaces", all=False)
    assert element.text == ""

def test_should_return_empty_string_when_text_is_empty(session):
    session.url = inline("""<p id="empty"></p>""")
    element = session.find.css("#empty", all=False)
    assert element.text == ""

def test_returns_empty_string_when_tag_is_self_closing(session):
    session.url = inline("""<p id="self-closed" />""")
    element = session.find.css("#self-closed", all=False)
    assert element.text == ""

def test_does_not_trim_spaces_when_line_wraps(session):
    session.url = inline("""
        <table id="wrappingtable">
          <tbody>
            <tr><td id="wrappingtd" style="width: 10px;"><span>beforeSpace</span><span> </span><span>afterSpace</span></td></tr>
          </tbody>
        </table>""")
    element = session.find.css("#wrappingtd", all=False)
    assert element.text == "beforeSpace afterSpace"

def test_correctly_handles_an_entire_table(session):
    session.url = inline("""
        <table id="wrappingtable">
          <tbody>
            <tr><td id="wrappingtd" style="width: 10px;"><span>beforeSpace</span><span> </span><span>afterSpace</span></td></tr>
          </tbody>
        </table>""")
    element = session.find.css("#wrappingtable", all=False)
    assert element.text == "beforeSpace afterSpace"

def test_handles_sibling_block_level_elements(session):
    session.url = inline("""<div id="twoblocks"><p>Some text</p><p>Some more text</p></div>""")
    element = session.find.css("#twoblocks", all=False)
    assert element.text == "Some text\nSome more text"
   
def test_handles_nested_block_level_elements(session):
    session.url = inline("""<div id="nestedblocks">Cheese <div><p>Some text</p><div><p>Some more text</p><p>and also</p></div></div>Brie</div>""")
    element = session.find.css("#nestedblocks", all=False)
    assert element.text == "Cheese\nSome text\nSome more text\nand also\nBrie"

def test_handles_whitespace_in_inline_elements(session):
    session.url = inline("""
        <p id="inline">This <span id="inlinespan">    line has <em>text</em>  </span> within elements that are meant to be displayed
        <!-- not as a block but --> inline</p>""")
    element = session.find.css("#inlinespan", all=False)
    assert element.text == "line has text"

def test_handle_lack_of_spaces_between_inline_elements(session):
    session.url = inline("""
        <div id="inlinenospaces">ooo<strong>O</strong>ooo</div>
        <div id="inlinenospaces2"><span>A <span></span>B</span></div>""")
    element = session.find.css("#inlinenospaces", all=False)
    assert element.text == "oooOooo"

    element = session.find.css("#inlinenospaces2", all=False)
    assert element.text == "A B"

def test_should_not_add_extra_spaces(session):
    session.url = inline("""
        <span><strong id="descartes">Dubito, <em>ergo cogito</em>, ergo sum.</strong></span>
        <span id="abc"><b>a</b> <b>b</b>c</span>""")

    text = session.find.css("#descartes", all=False).text
    text2 = session.find.css("#abc", all=False).text

    assert text == "Dubito, ergo cogito, ergo sum."
    assert text2 == "a bc"

def test_line_breaks_for_inline_elements(session):
    session.url = inline("""
        <form action="resultPage.html">
          <p>
            <input type="checkbox" id="checkbox1">
            <label id="label1" for="checkbox1">foo<br />bar</label>
          </p>
        </form>""")
    element = session.find.css("#label1", all=False)
    assert "foo\nbar" in element.text

def test_only_include_visible_text(session):
    session.url = inline("""
          <p id="suppressedParagraph" style="display: none">A paragraph suppressed using CSS display=none</p>
          <p id="outer" style="visibility: hidden">A <b id="visibleSubElement" style="visibility: visible">sub-element that is explicitly visible</b> using CSS visibility=visible</p>""")
    empty = session.find.css("#suppressedParagraph", all=False).text
    explicit = session.find.css("#outer", all=False).text

    assert empty == ""
    assert explicit == "sub-element that is explicitly visible"

def test_anchors_with_whitespace(session):
    session.url = inline("""
        <div id="links">
          <a href="">   link with leading space</a>
          <a href="" id="linkWithTrailingSpace">link with trailing space
          </a>
          <a href=""><b>link with formatting tags</b></a>
        </div>""")
    element = session.find.css("#links", all=False)
    assert element.text ==  "link with leading space link with trailing space link with formatting tags"

def test_trailing_whitespace(session):
    session.url = inline("""<div id="trailingSpaces">1\n<a href="">2</a>\n3\n<a href="">4</a></div>""")
    element = session.find.css("#trailingSpaces", all=False)
    assert element.text == "1 2 3 4"

def test_trailing_breaks(session):
    session.url = inline("""<div id="trailingBreaks">\n<span>a<br></span><span>b</span>\n</div>""")
    element = session.find.css("#trailingBreaks", all=False)
    assert element.text == "a\nb"

def test_keeps_non_breaking_spaces_before_a_tag(session):
    session.url = inline("""<a id="id2" >this is the&nbsp;<b>second</b> <span>element</span></a>""")
    element = session.find.css("#id2", all=False)
    assert element.text == "this is the second element"

def test_removes_zero_width_characters(session):
    session.url = inline("""<span id="zerowidth">This line has a bunch of ze&#8203;ro-width&lrm; characters&rlm; in it.</span>""")
    element = session.find.css("#zerowidth", all=False)
    assert element.text == "This line has a bunch of zero-width characters in it."

def test_transparent_text_is_ignored(session):
    session.url = inline("""<div id="opaque">Some <span class="transparent">transparent</span> text</div>""")
    element = session.find.css("#opaque", all=False)
    assert element.text == "Some text"

def _test_retains_the_formatting_of_text_within_a_pre_element(session):
    session.url = inline("""
        <div id="div-with-pre">
    <p>before pre</p>
    <pre id="preformatted">   This section has a preformatted
    text block    
  split in four lines
         </pre>
    <p>after pre</p>
  </div>""")
    element = session.find.css("#preformatted", all=False)
    assert element.text == "   This section has a preformatted\n    text block    \n  split in four lines\n         "

def test_retain_the_formatting_of_text_within_a_pre_element_that_is_within_a_regular_block(session):
    session.url = inline("""
        <div id="div-with-pre">
    <p>before pre</p>
    <pre id="preformatted">   This section has a preformatted
    text block    
  split in four lines
         </pre>
    <p>after pre</p>
  </div>""")
    element = session.find.css("#div-with-pre", all=False)
    assert element.text ==  "before pre\n   This section has a preformatted\n    text block    \n  split in four lines\n         \nafter pre"
