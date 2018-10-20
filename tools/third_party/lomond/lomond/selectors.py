from __future__ import unicode_literals

import select


class SelectorBase(object):
    """Abstraction for a kernel object that waits for socket data."""

    def __init__(self, socket):
        """Construct with an open socket."""
        self._socket = socket

    def wait(self, max_bytes, timeout=0.0):
        """Block until socket is readable or a timeout occurs. Return
        a tuple of <readable>,  <max bytes>.

        """
        if hasattr(self._socket, 'pending') and self._socket.pending():
            return True, self._socket.pending()
        readable = self.wait_readable(timeout=timeout)
        return readable, max_bytes

    def wait_readable(self, timeout=0.0):
        """Block until socket is readable or a timeout occurs, return
        `True` if the socket is readable, or `False` if the timeout
        occurred.

        """

    def close(self):
        """Close the selector (not the socket)."""


class SelectSelector(SelectorBase):  # pragma: no cover
    """Select Selector for use on Windows."""

    def __repr__(self):
        return '<SelectSelector>'

    def wait_readable(self, timeout=0.0):
        rlist, _wlist, _xlist = (
            select.select([self._socket.fileno()], [], [], timeout)
        )
        return bool(rlist)


class KQueueSelector(SelectorBase):  # pragma: no cover
    """KQueue selector for MacOS & BSD"""
    def __init__(self, socket):
        super(KQueueSelector, self).__init__(socket)
        self._queue = select.kqueue()
        self._events = [
            select.kevent(
                self._socket.fileno(),
                filter=select.KQ_FILTER_READ
            )
        ]

    def __repr__(self):
        return '<KQueueSelector>'

    def wait_readable(self, timeout=0.0):
        events = self._queue.control(
            self._events, 1, timeout
        )
        return bool(events)

    def close(self):
        self._queue.close()


class PollSelector(SelectorBase):
    """Poll selector for *nix"""
    def __init__(self, socket):
        super(PollSelector, self).__init__(socket)
        self._poll = select.poll()
        events = (
            select.POLLIN |
            select.POLLPRI |
            select.POLLERR |
            select.POLLHUP
        )
        self._poll.register(socket.fileno(), events)

    def __repr__(self):
        return '<PollSelector>'

    def wait_readable(self, timeout=0.0):
        events = self._poll.poll(timeout * 1000.0)
        return bool(events)


# Pick the appropriate selector for the given platform
if hasattr(select, 'kqueue'):
    PlatformSelector = KQueueSelector
elif hasattr(select, 'poll'):
    PlatformSelector = PollSelector
else:
    PlatformSelector = SelectSelector
