from pyppeteer import element

def pause(session, input_device, action):
    pass

def keyDown(session, input_device, action):
    assert 'value' in action

    session._send('Input.dispatchKeyEvent', {  # API status: stable
        'type': 'keyDown',
        'text': action['value']
    })

def keyUp(session, input_device, action):
    assert 'value' in action

    session._send('Input.dispatchKeyEvent', {  # API status: stable
        'type': 'keyUp',
        'text': action['value']
    })

# https://w3c.github.io/webdriver/#dfn-process-a-pointer-move-action
def pointerMove(session, input_device, action):
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

    device_id = input_device['id']
    state = session.pointer_states.get(device_id)
    if not state:
        state = session.pointer_states[device_id] = {}
    state['x'] = destination['x']
    state['y'] = destination['y']

    if input_device['parameters']['pointerType'] == 'touch':
        if state.get('vertical') == 'down':
            session._send('Input.dispatchTouchEvent', {  # API status: stable
                'type': 'touchMove',
                'touchPoints': [destination]
            })
    else:
        session._send('Input.dispatchMouseEvent', {  # API status: stable
            'type': 'mouseMoved',
            'x': destination['x'],
            'y': destination['y']
        })

# https://w3c.github.io/webdriver/#dfn-process-a-pointer-up-or-pointer-down-action
def _pointer_vertical(session, input_device, action, direction):
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


    device_id = input_device['id']
    if device_id not in session.pointer_states:
        session.pointer_states[device_id] = {}
    session.pointer_states[device_id]['vertical'] = direction

    if input_device['parameters']['pointerType'] == 'touch':
        if direction == 'up':
            event_type = 'touchEnd'
            touch_points = []
        else:
            event_type = 'touchStart'
            touch_points = [
                {
                    'x': session.pointer_states[input_device['id']]['x'],
                    'y': session.pointer_states[input_device['id']]['y']
                }
            ]

        session._send('Input.dispatchTouchEvent', {  # API status: stable
            'type': event_type,
            'touchPoints': touch_points
        })
    else:
        event_type = 'mouseReleased' if direction == 'up' else 'mousePressed'
        session._send('Input.dispatchMouseEvent', {  # API status: stable
            'type': event_type,
            'button': button,
            'clickCount': 1,
            'x': session.pointer_states[input_device['id']]['x'],
            'y': session.pointer_states[input_device['id']]['y']
        })

def pointerUp(session, input_device, action):
    return _pointer_vertical(session, input_device, action, 'up')

def pointerDown(session, input_device, action):
    return _pointer_vertical(session, input_device, action, 'down')
