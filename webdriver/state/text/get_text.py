import pytest
import uuid

from support.asserts import assert_error, assert_success
from support.inline import inline

def test_getting_text_of_a_non_existant_element_is_an_error(new_session):
   _, session = new_session({})
   session.url = inline("""<body>Hello world</body>""")
   id = uuid.uuid4()

   result = session.transport.send(
       "GET",
       "session/%s/element/%s/text" % (session.session_id, id))

   assert_error(result, "no such element")


def test_read_element_text(new_session):
    _, session = new_session({})
    session.url = inline("""
        <body>
          Noise before <span id='id'>This has an ID</span>. Noise after
        </body>""")

    element_id = session.find.css("#id", all=False).id

    text = session.send_session_command("GET", "element/%s/text" % element_id)

    assert text == "This has an ID"
