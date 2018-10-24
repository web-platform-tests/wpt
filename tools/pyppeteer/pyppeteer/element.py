class Element(object):
    def __init__(self, session, remote_object_id):
        self._session = session
        self._remote_object_id = remote_object_id

    def _center(self):
        quads = self._session._send('DOM.getBoxModel', {
            'objectId': self._remote_object_id
        })['model']['margin']

        return {
          'x': float(quads[0] + quads[2]) / 2,
          'y': float(quads[1] + quads[5]) / 2
        }

    def click(self):
        center = self._center()
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
