from frame import Frame, OPCODE_TEXT, OPCODE_BINARY


__all__ = ['Message', 'TextMessage', 'BinaryMessage']


class Message(object):
    def __init__(self, opcode, payload):
        self.opcode = opcode
        self.payload = payload

    def frame(self, mask=False):
        return Frame(self.opcode, self.payload, mask=mask)

    def fragment(self, fragment_size, mask=False):
        return self.frame().fragment(fragment_size, mask)

    def __str__(self):
        return '<%s opcode=0x%X size=%d>' \
               % (self.__class__.__name__, self.opcode, len(self.payload))


class TextMessage(Message):
    def __init__(self, payload):
        super(TextMessage, self).__init__(OPCODE_TEXT, unicode(payload))

    def frame(self, mask=False):
        return Frame(self.opcode, self.payload.encode('utf-8'), mask=mask)

    def __str__(self):
        if len(self.payload) > 30:
            return '<TextMessage "%s"... size=%d>' \
                    % (self.payload[:30], len(self.payload))

        return '<TextMessage "%s" size=%d>' % (self.payload, len(self.payload))


class BinaryMessage(Message):
    def __init__(self, payload):
        super(BinaryMessage, self).__init__(OPCODE_BINARY, bytearray(payload))


def create_message(opcode, payload):
    if opcode == OPCODE_TEXT:
        return TextMessage(payload.decode('utf-8'))

    if opcode == OPCODE_BINARY:
        return BinaryMessage(payload)

    return Message(opcode, payload)
