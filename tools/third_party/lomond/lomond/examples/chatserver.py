from tornado import gen, ioloop, web, websocket

INTRO = b"""\
  _                                     _
 | |                                   | |
 | |     ___  _ __ ___   ___  _ __   __| |
 | |    / _ \| '_ ` _ \ / _ \| '_ \ / _` |
 | |___| (_) | | | | | | (_) | | | | (_| |
 |______\___/|_| |_| |_|\___/|_| |_|\__,_|
   _____ _           _    _____
  / ____| |         | |  / ____|
 | |    | |__   __ _| |_| (___   ___ _ ____   _____ _ __
 | |    | '_ \ / _` | __|\___ \ / _ \ '__\ \ / / _ \ '__|
 | |____| | | | (_| | |_ ____) |  __/ |   \ V /  __/ |
  \_____|_| |_|\__,_|\__|_____/ \___|_|    \_/ \___|_|

 The simplest chat server imaginable.
"""

def col(text):
    return u'\x1b[1;34m{}\x1b[0m'.format(text)

class ChatHandler(websocket.WebSocketHandler):

    chatting = set()

    def check_origin(self, origin):
        return True

    @gen.coroutine
    def open(self):
        self.set_nodelay(True)
        self.chatting.add(self)
        yield self.write_message(col(INTRO))

    def on_close(self):
        self.chatting.remove(self)

    @gen.coroutine
    def on_message(self, chat):
        for chatter in self.chatting:
            if chatter is not self:
                yield chatter.write_message(col(chat))

app = web.Application([
    (r'^/chat/$', ChatHandler),
])
app.listen(9001)
ioloop.IOLoop.instance().start()