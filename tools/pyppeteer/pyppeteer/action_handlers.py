from pyppeteer import element

def pause(session, input_id, action):
    pass

def keyDown(session, input_id, action):
    assert 'value' in action

    session._send('Input.dispatchKeyEvent', {  # API status: stable
        'type': 'keyDown',
        'text': action['value']
    })

def keyUp(session, input_id, action):
    assert 'value' in action

    session._send('Input.dispatchKeyEvent', {  # API status: stable
        'type': 'keyUp',
        'text': action['value']
    })

# https://w3c.github.io/webdriver/#dfn-process-a-pointer-move-action
def pointerMove(session, input_id, action):
    assert 'x' in action
    assert 'y' in action
    assert 'type' in action
    assert action['type'] == 'pointerMove'
    destination = {}

    if 'origin' not in action or action['origin'] == 'viewport':
        destination['x'] = action['x']
        destination['y'] = action['y']
    elif action['origin'] == 'pointer':
        raise NotImplementedError('"pointer" origin not yet available')
    elif isinstance(action['origin'], element.Element):
        center = action['origin'].in_view_center()
        destination['x'] = center['x'] + action['x']
        destination['y'] = center['y'] + action['y']
    else:
        raise Exception('Faulty origin: %s' % action['origin'])

    session.mouse_positions[input_id] = destination

    session._send('Input.dispatchMouseEvent', {  # API status: stable
        'type': 'mouseMoved',
        'x': destination['x'],
        'y': destination['y']
    })

# https://w3c.github.io/webdriver/#dfn-process-a-pointer-up-or-pointer-down-action
def _pointer_vertical(session, input_id, action, event_type):
    assert 'button' in action
    assert type(action['button']) is int
    assert action['button'] >= 0

    # https://www.w3.org/TR/pointerevents/#the-button-property
    button = {
        0: 'left',
        1: 'middle',
        2: 'right'
    }.get(action['button'], None)

    if button is None:
        raise NotImplementedError(
            'Inaddressable button ID: %s' % action['button']
        )

    session._send('Input.dispatchMouseEvent', {  # API status: stable
        'type': event_type,
        'button': button,
        'clickCount': 1,
        'x': session.mouse_positions[input_id]['x'],
        'y': session.mouse_positions[input_id]['y']
    })

def pointerUp(session, input_id, action):
    return _pointer_vertical(session, input_id, action, 'mouseReleased')

def pointerDown(session, input_id, action):
    return _pointer_vertical(session, input_id, action, 'mousePressed')
