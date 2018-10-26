import element

def pause(session, action):
    pass

def keyDown(session, action):
    assert 'value' in action

    session._send('Input.dispatchKeyEvent', { # API status: stable
        'type': 'keyDown',
        'text': action['value']
    })

def keyUp(session, action):
    assert 'value' in action

    session._send('Input.dispatchKeyEvent', { # API status: stable
        'type': 'keyUp',
        'text': action['value']
    })

# https://w3c.github.io/webdriver/#dfn-process-a-pointer-move-action
def pointerMove(session, action):
    assert 'x' in action
    assert 'y' in action
    assert 'type' in action
    assert action['type'] == 'pointerMove'
    destination = {}

    if 'origin' not in action or action['origin'] == 'viewport':
        destination['x'] = action['x']
        destination['y'] = action['y']
    elif action['origin'] == 'pointer':
        raise NotImplemented('"pointer" origin not yet available')
    elif isinstance(action['origin'], element.Element):
        center = action['origin'].in_view_center()
        destination['x'] = center['x'] + action['x']
        destination['y'] = center['y'] + action['y']
    else:
        raise Exception('Faulty origin: %s' % action['origin'])

    session._send('Input.dispatchMouseEvent', { # API status: stable
        'type': 'mouseMoved',
        'x': destination['x'],
        'y': destination['y']
    })

# https://w3c.github.io/webdriver/#dfn-process-a-pointer-up-or-pointer-down-action
def _pointer_vertical(session, action, event_type):
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

    session._send('Input.dispatchMouseEvent', { # API status: stable
        'type': event_type,
        'button': button,
        'clickCount': 1,
        'x': session.mouse_position['x'],
        'y': session.mouse_position['y']
    })

def pointerUp(session, action):
    return _pointer_vertical(session, action, 'mouseReleased')

def pointerDown(session, action):
    return _pointer_vertical(session, action, 'mousePressed')
