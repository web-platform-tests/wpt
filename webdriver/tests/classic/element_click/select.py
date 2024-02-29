from tests.support.asserts import (
    assert_in_events,
    assert_events_equal,
)

def test_click_option(session, inline):
    session.url = inline("""
      <select>
        <option>first
        <option>second
      </select>""")
    options = session.find.css("option")

    assert options[0].selected
    assert not options[1].selected

    options[1].click()
    assert options[1].selected
    assert not options[0].selected


def test_click_multiple_option(session, inline):
    session.url = inline("""
      <select multiple>
        <option>first
        <option>second
      </select>""")
    options = session.find.css("option")

    assert not options[0].selected
    assert not options[1].selected

    options[0].click()
    assert options[0].selected
    assert not options[1].selected


def test_click_preselected_option(session, inline):
    session.url = inline("""
      <select>
        <option>first
        <option selected>second
      </select>""")
    options = session.find.css("option")

    assert not options[0].selected
    assert options[1].selected

    options[1].click()
    assert options[1].selected
    assert not options[0].selected

    options[0].click()
    assert options[0].selected
    assert not options[1].selected


def test_click_preselected_multiple_option(session, inline):
    session.url = inline("""
      <select multiple>
        <option>first
        <option selected>second
      </select>""")
    options = session.find.css("option")

    assert not options[0].selected
    assert options[1].selected

    options[1].click()
    assert not options[1].selected
    assert not options[0].selected

    options[0].click()
    assert options[0].selected
    assert not options[1].selected


def test_click_deselects_others(session, inline):
    session.url = inline("""
      <select>
        <option>first
        <option>second
        <option>third
      </select>""")
    options = session.find.css("option")

    options[0].click()
    assert options[0].selected
    options[1].click()
    assert options[1].selected
    options[2].click()
    assert options[2].selected
    options[0].click()
    assert options[0].selected


def test_click_multiple_does_not_deselect_others(session, inline):
    session.url = inline("""
      <select multiple>
        <option>first
        <option>second
        <option>third
      </select>""")
    options = session.find.css("option")

    options[0].click()
    assert options[0].selected
    options[1].click()
    assert options[0].selected
    assert options[1].selected
    options[2].click()
    assert options[0].selected
    assert options[1].selected
    assert options[2].selected


def test_click_selected_option(session, inline):
    session.url = inline("""
      <select>
        <option>first
        <option>second
      </select>""")
    options = session.find.css("option")

    # First <option> is selected in dropdown
    assert options[0].selected
    assert not options[1].selected

    options[1].click()
    assert options[1].selected
    options[1].click()
    assert options[1].selected


def test_click_selected_multiple_option(session, inline):
    session.url = inline("""
      <select multiple>
        <option>first
        <option>second
      </select>""")
    options = session.find.css("option")

    # No implicitly selected <option> in <select multiple>
    assert not options[0].selected
    assert not options[1].selected

    options[0].click()
    assert options[0].selected
    assert not options[1].selected

    # Second click in <select multiple> deselects
    options[0].click()
    assert not options[0].selected
    assert not options[1].selected


def test_out_of_view_dropdown(session, inline):
    session.url = inline("""
      <select>
        <option>1
        <option>2
        <option>3
        <option>4
        <option>5
        <option>6
        <option>7
        <option>8
        <option>9
        <option>10
        <option>11
        <option>12
        <option>13
        <option>14
        <option>15
        <option>16
        <option>17
        <option>18
        <option>19
        <option>20
      </select>""")
    options = session.find.css("option")

    options[14].click()
    assert options[14].selected


def test_out_of_view_multiple(session, inline):
    session.url = inline("""
      <select multiple>
        <option>1
        <option>2
        <option>3
        <option>4
        <option>5
        <option>6
        <option>7
        <option>8
        <option>9
        <option>10
        <option>11
        <option>12
        <option>13
        <option>14
        <option>15
        <option>16
        <option>17
        <option>18
        <option>19
        <option>20
      </select>""")
    options = session.find.css("option")

    last_option = options[-1]
    last_option.click()
    assert last_option.selected


def test_option_disabled(session, inline, add_event_listeners):
    session.url = inline("""
        <select>
          <option disabled>foo
          <option>bar
        </select>""")
    select = session.find.css("select", all=False)
    add_event_listeners(select, ["change", "input"])

    disabled_option = session.find.css("option", all=False)
    assert not disabled_option.selected

    disabled_option.click()
    assert not disabled_option.selected
    assert_events_equal(session, [])

    enabled_option = session.find.css("option:not([disabled])", all=False)
    assert enabled_option.selected

    enabled_option.click()
    assert_events_equal(session, ["input"])

def test_select_change_events(session, inline, add_event_listeners):
    session.url = inline("""
        <select id="select">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3" id="third">3</option>
            <option value="4">4</option>
        </select>""")
    select = session.find.css("select", all=False)
    add_event_listeners(select, ["change", "input"])

    option = session.find.css("select > option#third", all=False)
    option.click()
    assert_in_events(session, ["change", "input"])
