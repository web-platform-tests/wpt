import pytest

from tests.support.inline import inline

def test_ignore_script_tags(session):
    session.url = inline("""
        <form id="form1" action="javascriptEnhancedForm.html" method="post">
            <p>
                <label id="labelforusername" for="username">
                    Username: <input id="username" type="text" name="username" />
                    <script type="text/javascript">
                        document.getElementById('username').value = 'Michael';
                    </script>
                </label>
            </p>""")
    element = session.find.css("#labelforusername", all=False)
    assert element.text == "Username:"

def test_text_should_be_trimmed(session):
    session.url = inline("""<div id="multiline">
        <p>A div containing</p>
        More than one line of text<br/>

        <div>and block level elements</div>
        </div>""")
    text = session.find.css("#multiline", all=False).text
    assert text.startswith("A div containing")
    assert text.endswith("block level elements")

def test_does_not_collapse_non_breaking_spaces(session):
    session.url = inline("""<p id="nbspandspaces">This line has a &nbsp; non-breaking space and spaces</p>""")
    element = session.find.css("#nbspandspaces", all=False)
    assert element.text == "This line has a   non-breaking space and spaces"

def test_does_not_trim_non_breaking_spaces_at_the_start_of_a_line_in_the_middle_of_text(session):
    session.url = inline("""<p id="multilinenbsp">These lines &nbsp<br />&nbsp have leading and trailing NBSPs&nbsp;&nbsp;</p>""")
    text = session.find.css("#multilinenbsp", all=False).text
    assert text.startswith("These lines  \n")
    assert "\n  have" in text

def test_does_not_trim_whitespace_when_line_wraps(session):
    session.url = inline("""<table>
        <tbody>
          <tr><td id="cell" style="width: 10px;"><span>beforeSpace</span><span> </span><span>afterSpace</span></td></tr>
        </tbody>
      </table>""")
    element = session.find.css("#cell", all=False)
    assert element.text == "beforeSpace afterSpace"

def test_whitespace_in_inline_elements(session):
    session.url = inline("""<p>This <span id="inlinespan">    line has <em>text</em></span> within elements that are meant to be displayed
        <!-- not as a block but --> inline</p>""")
    element = session.find.css("#inlinespan", all=False)
    assert element.text == "line has text"

def test_only_include_visible_text(session):
    session.url = inline("""<p id="suppressedParagraph" style="display: none">A paragraph suppressed using CSS display=none</p>""")
    element = session.find.css("#suppressedParagraph", all=False)
    assert element.text == ""

    session.url = inline("""<p id="outer" style="visibility: hidden">A <b id="visibleSubElement" style="visibility: visible">sub-element that is explicitly visible</b> using CSS visibility=visible</p>""")
    element = session.find.css("#outer", all=False)
    assert element.text == "sub-element that is explicitly visible"

def test_text_of_an_input_element_should_be_empty(session):
    session.url = inline("""<form method="get" name="disable"><input type="text" id="inputWithText" value="Example text"/></form>""")
    element = session.find.css("#inputWithText", all=False)
    assert element.text == ""

def test_text_of_a_textarea_should_be_equal_to_its_default_text(session):
    session.url = inline("""<form><textarea id="withText" rows="5" cols="5">Example text</textarea></form>""")
    element = session.find.css("#withText", all=False)
    assert element.text == "Example text"

def test_text_of_a_textarea_should_be_equal_to_its_default_text_even_after_typing(session):
    session.url = inline("""<form><textarea id="withText" rows="5" cols="5">Example text</textarea></form>""")
    element = session.find.css("#withText", all=False)
    element.clear()
    element.send_keys("New Text")
    assert element.text == "Example text"

def test_text_of_a_textarea_should_be_equal_to_its_default_text_even_after_changing_the_value(session):
    session.url = inline("""<form><textarea id="withText" rows="5" cols="5">Example text</textarea></form>""")
    element = session.find.css("#withText", all=False)
    session.execute_script("arguments[0].value = arguments[1]", args=[element.json(), "New Text"])
    assert element.text == "Example text"

def test_can_get_text_that_is_a_valid_json_object(session):
    session.url = inline("""<span id="simpleJsonText">{a="b", c=1, d=true}</span>""")
    element = session.find.css("#simpleJsonText", all=False)
    assert element.text == "{a=\"b\", c=1, d=true}"

def test_handles_text_that_looks_like_a_numer(session):
    session.url = inline("""<div id='point'>12.345</div><div id='comma'>12,345</div><div id='space'>12 345</div>""")
    assert session.find.css("#point", all=False).text == "12.345"
    assert session.find.css("#comma", all=False).text == "12,345"
    assert session.find.css("#space", all=False).text == "12 345"
