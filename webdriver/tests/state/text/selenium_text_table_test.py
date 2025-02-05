import pytest

from tests.support.inline import inline


# This test was derived from the Selenium project's test suite, which
# is copyright the Software Freedom Conservancy. The original source
# license was the Apache 2.0 licese, a copy of which can be found at:
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# The original source for this can be found at:
#
# https://github.com/SeleniumHQ/selenium/blob/selenium-3.5.2/javascript/atoms/test/text_table_test.html

def body(text):
    return "<body>%s" % text

def table(text):
    return "<table>%s</table>" % text

def tbody(*args):
    return "<tbody>%s</tbody>" % "".join(args)

def tr(*args):
    return "<tr>%s</tr>" % "".join(args)

def td(*args):
    return "<td>%s</td>" % "".join(args)


def assert_text(session, table_definition, expected_text):
    session.url = inline(body(table_definition))

    element = session.find.css("body", all=False)

    assert element.text == expected_text

def test_empty_table(session):
    assert_text(session, table(""), "")

def test_empty_table_body(session):
    assert_text(session, table(tbody("")), "");

def test_empty_row(session):
    assert_text(session, table(tbody(tr(""))), "")

def text_one_empty_cell(session):
    assert_text(session, table(tbody(tr(td("")))), "")

def text_two_empty_cells(session):
    assert_text(session, table(tbody(tr(td(""), td("")))), "")

def test_table_without_tbody(session):
    assert_text(session, table(tr(td("a"))), "a")

def test_one_line_table(session):
    assert_text(session, table(tbody(tr(td("a"), td("b")))), "a b")

def test_simple_table(session):
    assert_text(
        session,
        table(tbody(
            tr(td("a"), td("b")),
            tr(td("c"), td("d")))),
        "a b\nc d")
           
def test_simple_table_with_empty_row(session):
    assert_text(
        session,
        table(tbody(
            tr(td("a"), td("b")),
            tr(td(""), td("")))),
        "a b") 

def test_simple_table_with_newlines_between_cells(session):
    assert_text(
        session,
        table(tbody(
            tr(td("a"), "\n", td("b")),
            tr(td("c"), "\n", td("d")))),
        "a b\nc d")

def test_simple_table_cells_end_with_newlines(session):
    assert_text(
        session,
        table(tbody(
            tr(td("a\n"), td("b\n")),
            tr(td("c\n"), td("d\n")))),
        "a b\nc d")

def test_simple_teable_with_newlines_between_rows(session):
    assert_text(
        session,
        table(tbody(
            tr(td("a"), td("b"), "\n\n"),
            tr(td("c"), td("d")))),
        "a b\nc d")

def test_a_table_with_a_caption(session):
    assert_text(
        session,
        table(tbody(
            "<caption>This is a caption</caption>",
            tr(td("a"), td("b")),
            tr(td("c"), td("d")))),
        "This is a caption\na b\nc d")

def test_a_table_with_empty_cells(session):
    assert_text(
        session,
        table(tbody(
            tr(td("a"), td("b"), td("c")),
            tr(td(""), td(""), td("Previous two cells were empty")))),
        "a b c\nPrevious two cells were empty")

def test_a_table_with_paragraphs(session):
    assert_text(
        session,
        table(tbody(tr(
            td("<p>table cell ", "<p>with ", "<p>paragraphs"),
            td("Cell #2")))),
        "table cell\nwith\nparagraphs\nCell #2")

def test_nested_tables(session):
    assert_text(
        session,
        table(tbody(
            tr(td("Table 1, Row 1, Cell 1"), td("Table 1, Row 1, Cell 2")),
            tr(td("Table 1, Row 2, Cell 1"),
               td("Table 1, Row 2, Cell 2",
                  table(tbody(
                      tr(td("Table 2, Row 1, Cell 1"),
                         td("Table 2, Row 1, Cell 2")))))))),
        ("Table 1, Row 1, Cell 1 Table 1, Row 1, Cell 2\n"
         "Table 1, Row 2, Cell 1 Table 1, Row 2, Cell 2\n"
         "Table 2, Row 1, Cell 1 Table 2, Row 1, Cell 2"))

def test_nested_tables_rows_in_outer_table_after_inner_table(session):
    assert_text(
        session,
        table(tbody(
            tr(td("Table 1, Row 1, Cell 1"), td("Table 1, Row 1, Cell 2")),
            tr(td("Table 1, Row 2, Cell 1"),
               td("Table 1, Row 2, Cell 2",
                  table(tbody(
                      tr(td("Table 2, Row 1, Cell 1"),
                         td("Table 2, Row 1, Cell 2")))))),
            tr(td("Table 1, Row 3, Cell 1"), td("Table 1, Row 3, Cell 2")))),
        ("Table 1, Row 1, Cell 1 Table 1, Row 1, Cell 2\n"
         "Table 1, Row 2, Cell 1 Table 1, Row 2, Cell 2\n"
         "Table 2, Row 1, Cell 1 Table 2, Row 1, Cell 2\n"
         "Table 1, Row 3, Cell 1 Table 1, Row 3, Cell 2"))

def test_nested_tables_now_with_newlines(session):
    assert_text(
        session,
        """
        <table id="nestedTable">
          <tr>
            <td>
              Table 1, Row 1, Cell 1
            </td>
            <td>
              Table 1, Row 1, Cell 2
            </td>
          </tr>
          <tr>
            <td>
              Table 1, Row 2, Cell 1
            </td>
            <td>
              Table 1, Row 2, Cell 2
              <table>
                <tr>
                  <td>
                    Table 2, Row 1, Cell 1
                  </td>
                  <td>
                    Table 2, Row 1, Cell 2
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              Table 1, Row 3, Cell 1
            </td>
            <td>
              Table 1, Row 3, Cell 2
            </td>
          </tr>
        </table>""",
        ("Table 1, Row 1, Cell 1 Table 1, Row 1, Cell 2\n"
         "Table 1, Row 2, Cell 1 Table 1, Row 2, Cell 2\n"
         "Table 2, Row 1, Cell 1 Table 2, Row 1, Cell 2\n"
         "Table 1, Row 3, Cell 1 Table 1, Row 3, Cell 2"))

def test_table_with_collapsed_rows(session):
    assert_text(
        session,
        """
        <table>
          <tr><td>a</td></tr>
          <tr style="visibility:collapse"><td>b</td></tr>
          <tr><td>c</td></tr>
        </table>""",
        "a\nc")
