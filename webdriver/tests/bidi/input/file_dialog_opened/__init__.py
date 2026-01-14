from tests.bidi import recursive_compare, any_bool, any_dict


def assert_file_dialog_opened_event(event, context, user_context, multiple=any_bool,
        element=any_dict):
    recursive_compare({
        'context': context,
        'userContext': user_context,
        'element': element,
        'multiple': multiple
    }, event)
