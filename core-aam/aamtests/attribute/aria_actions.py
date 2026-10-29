# Testing: https://w3c.github.io/core-aam/#ariaActions

def test_atspi(atspi, session, url):
    session.url = url("core-aam/aamtests/attribute/aria_actions.html")

    node = atspi.find_node("test", session.url)

    # Object Attribute: has-actions:true
    assert "has-actions:true" in atspi.Accessible.get_attributes_as_array(node)

    # Interface: AtkAction
    actions = atspi.Accessible.get_action_iface(node)
    assert actions is not None

    # get_n_actions: add the number of accessible nodes referenced by
    #   aria-actions that are exposed in the accessibility tree
    num_actions = actions.get_n_actions();
    assert num_actions > 0

    # get_name: if the corresponding target node has a DOM id, return that DOM
    #   id prefixed by "custom_". Otherwise, return "custom".
    # get_localized_name: return the corresponding target node's accessible
    #   name.
    matched = [a for a in range(0, num_actions) if actions.get_action_name(a) == "custom_otherthing"]

    assert len(matched) == 1
    action_id = matched[0]
    assert actions.get_action_name(action_id) == "custom_otherthing"
    assert actions.get_localized_name(action_id) == "Close"

    # do_action: behave as if do_action(0) were called on the corresponding
    #   target accessible node.
    assert actions.do_action(action_id)
    button = session.find.css("#otherthing")
    assert button[0].text == "Open"
