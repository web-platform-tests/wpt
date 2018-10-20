"""
Coroutine Parser
================

This little but of 'magic' makes parsing a stream of bytes from a socket
a relatively pain-free exercise.

"""

from __future__ import unicode_literals


class ParseError(Exception):
    """Stream failed to parse."""


class ParseEOF(ParseError):
    """End of Stream."""


class _Awaitable(object):
    """An operation that effectively suspends the coroutine."""
    # Analogous to Python3 asyncio concept
    __slots__ = []

    def validate(self, chunk):
        """Raise any ParseErrors"""


class _ReadBytes(_Awaitable):
    """Reads a fixed number of bytes."""
    __slots__ = ['remaining']

    def __init__(self, count):
        self.remaining = count


class _ReadUtf8(_ReadBytes):
    """Reads a fixed number of bytes, validates utf-8."""
    __slots__ = ['utf8_validator']

    def __init__(self, count, utf8_validator):
        self.remaining = count
        self.utf8_validator = utf8_validator

    def validate(self, data):
        valid, _, _, _ = self.utf8_validator.validate(bytes(data))
        if not valid:
            raise ParseError('invalid utf8')


class _ReadUntil(_Awaitable):
    """Read until a separator."""
    __slots__ = ['sep', 'max_bytes']

    def __init__(self, sep, max_bytes=None):
        self.sep = sep
        self.max_bytes = max_bytes

    def check_length(self, pos):
        """Check the length is within max bytes."""
        if self.max_bytes is not None and pos > self.max_bytes:
            raise ParseError(
                'expected {!r}'.format(self.sep)
            )


class Parser(object):
    """
    Coroutine based stream parser.

    Splits a steam of arbitrary sequences of bytes in to logical
    objects. The `feed` method will yield any results of parsing.

    Here's an example of use::

        while True:
            data = sock.recv(1024)
            for obj in parser.feed(data):
                self.on_obj(obj)

    The coroutine magic allows parsers to be non-blocking while still
    implemented in a simple procedural manner.

    """

    def __init__(self):
        self._gen = None
        self._awaiting = None
        self._buffer = bytearray()  # Buffer for reads
        self._eof = False
        self.reset()

    read = _ReadBytes
    read_utf8 = _ReadUtf8
    read_until = _ReadUntil

    def __del__(self):
        self.close()

    @property
    def is_eof(self):
        return self._eof

    def reset(self):
        """Reset the parser, so it may be used on a fresh stream."""
        self._gen = self.parse()
        self._awaiting = next(self._gen)

    def close(self):
        """Close the parser."""
        if self._gen is not None:
            self._gen.close()
            self._gen = None

    def feed(self, data):
        """
        Called with data (bytes), will yield 0 or more objects parsed
        from the stream.

        :param bytes data: Data to parse.

        """
        def _check_length(pos):
            try:
                self._awaiting.check_length(pos)
            except ParseError as error:
                self._awaiting = self._gen.throw(error)

        if self._eof:
            raise ParseError('end of file reached')
        if not data:
            self._eof = True
            self._gen.throw(
                ParseError('unexpected eof of file')
            )

        _buffer = self._buffer
        pos = 0
        while pos < len(data):
            # Awaiting a read of a fixed number of bytes
            if isinstance(self._awaiting, _ReadBytes):
                # This many bytes left to read
                remaining = self._awaiting.remaining
                # Bite off remaining bytes
                chunk = data[pos:pos + remaining]
                chunk_size = len(chunk)
                pos += chunk_size
                try:
                    # Validate new data
                    self._awaiting.validate(chunk)
                except ParseError as error:
                    # Raises an exception in parse()
                    self._awaiting = self._gen.throw(error)
                # Add to buffer
                _buffer.extend(chunk)
                remaining -= chunk_size
                if remaining:
                    # Await more bytes
                    self._awaiting.remaining = remaining
                else:
                    # Send to coroutine, get new 'awaitable'
                    self._awaiting = self._gen.send(_buffer[:])
                    del _buffer[:]

            # Awaiting a read until a terminator
            elif isinstance(self._awaiting, _ReadUntil):
                # Reading to separator
                chunk = data[pos:]
                _buffer.extend(chunk)
                sep = self._awaiting.sep
                sep_index = _buffer.find(sep)

                if sep_index == -1:
                    # Separator not found, advance position
                    pos += len(chunk)
                    _check_length(len(_buffer))
                else:
                    # Found separator
                    # Get data prior to and including separator
                    sep_index += len(sep)
                    _check_length(sep_index)
                    # Reset data, to continue parsing
                    data = _buffer[sep_index:]
                    pos = 0
                    # Send bytes to coroutine, get new 'awaitable'
                    self._awaiting = self._gen.send(_buffer[:sep_index])
                    del _buffer[:]

            # Yield any non-awaitables...
            while not isinstance(self._awaiting, _Awaitable):
                yield self._awaiting
                self._awaiting = next(self._gen)

    def parse(self):
        """
        A generator to parse incoming stream.

        Yield the result of `self.read` to read n bytes from the stream.
        Yield any parsed objects

        Here's an example::

            size = struct.unpack('<I', yield self.read(4))
            data = yield self.read(size)
            yield data.decode()

        """
        yield


if __name__ == "__main__":  # pragma: no cover
    class TestParser(Parser):
        def parse(self):
            data = yield self.read_until(b'\r\n\r\n')
            yield data
            data = yield self.read(1)
            yield data
            data = yield self.read(2)
            yield data
            data = yield self.read(4)
            yield data
            data = yield self.read(2)
            yield data
    parser = TestParser()
    for b in (b'head', b'ers: example', b'\r\n', b'\r\n', b'12', b'34', b'5', b'678', b'90'):
        for frame in parser.feed(b):
            print(repr(frame))
