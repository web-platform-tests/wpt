class Element(object):
    def __init__(self, session, remote_object_id):
        self._session = session
        self._remote_object_id = remote_object_id

    # In-view center point
    # https://w3c.github.io/webdriver/#dfn-center-point
    def in_view_center(self):
        inner_width, inner_height = self._session.execute_script(
            'return [innerWidth, innerHeight];'
        )
        quads = self._session._send('DOM.getBoxModel', {
            'objectId': self._remote_object_id
        })['model']['margin']

        left = max(0, min(quads[0], quads[2]))
        right = min(inner_width, max(quads[0], quads[2]))
        top = max(0, min(quads[1], quads[5]))
        bottom = min(inner_height, max(quads[1], quads[5]))

        return {
          'x': int((left + right) / 2),
          'y': int((top + bottom) / 2)
        }

    def click(self):
        center = self.in_view_center()
        self._session._send('Input.dispatchMouseEvent', {
          'type': 'mouseMoved',
          'x': center['x'],
          'y': center['y']
        })
        self._session._send('Input.dispatchMouseEvent', {
          'type': 'mousePressed',
          'button': 'left',
          'clickCount': 1,
          'x': center['x'],
          'y': center['y']
        })
        self._session._send('Input.dispatchMouseEvent', {
          'type': 'mouseReleased',
          'button': 'left',
          'clickCount': 1,
          'x': center['x'],
          'y': center['y']
        })

    def send_keys(self, text):
        self._session._send('DOM.focus', {
            'objectId': self._remote_object_id
        })

        for char in text:
            self._session._send('Input.dispatchKeyEvent', {
                'type': 'keyDown',
                'text': char
            })
            self._session._send('Input.dispatchKeyEvent', {
                'type': 'keyUp'
            })
