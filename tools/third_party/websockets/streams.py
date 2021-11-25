from typing import Generator


class StreamReader:
    """
    Generator-based stream reader.

    This class doesn't support concurrent calls to :meth:`read_line()`,
    :meth:`read_exact()`, or :meth:`read_to_eof()`. Make sure calls are
    serialized.

    """

    def __init__(self) -> None:
        self.buffer = bytearray()
        self.eof = False

    def read_line(self) -> Generator[None, None, bytes]:
        """
        Read a LF-terminated line from the stream.

        The return value includes the LF character.

        This is a generator-based coroutine.

        :raises EOFError: if the stream ends without a LF

        """
        n = 0  # number of bytes to read
        p = 0  # number of bytes without a newline
        while True:
            n = self.buffer.find(b"\n", p) + 1
            if n > 0:
                break
            p = len(self.buffer)
            if self.eof:
                raise EOFError(f"stream ends after {p} bytes, before end of line")
            yield
        r = self.buffer[:n]
        del self.buffer[:n]
        return r

    def read_exact(self, n: int) -> Generator[None, None, bytes]:
        """
        Read ``n`` bytes from the stream.

        This is a generator-based coroutine.

        :raises EOFError: if the stream ends in less than ``n`` bytes

        """
        assert n >= 0
        while len(self.buffer) < n:
            if self.eof:
                p = len(self.buffer)
                raise EOFError(f"stream ends after {p} bytes, expected {n} bytes")
            yield
        r = self.buffer[:n]
        del self.buffer[:n]
        return r

    def read_to_eof(self) -> Generator[None, None, bytes]:
        """
        Read all bytes from the stream.

        This is a generator-based coroutine.

        """
        while not self.eof:
            yield
        r = self.buffer[:]
        del self.buffer[:]
        return r

    def at_eof(self) -> Generator[None, None, bool]:
        """
        Tell whether the stream has ended and all data was read.

        This is a generator-based coroutine.

        """
        while True:
            if self.buffer:
                return False
            if self.eof:
                return True
            # When all data was read but the stream hasn't ended, we can't
            # tell if until either feed_data() or feed_eof() is called.
            yield

    def feed_data(self, data: bytes) -> None:
        """
        Write ``data`` to the stream.

        :meth:`feed_data()` cannot be called after :meth:`feed_eof()`.

        :raises EOFError: if the stream has ended

        """
        if self.eof:
            raise EOFError("stream ended")
        self.buffer += data

    def feed_eof(self) -> None:
        """
        End the stream.

        :meth:`feed_eof()` must be called at must once.

        :raises EOFError: if the stream has ended

        """
        if self.eof:
            raise EOFError("stream ended")
        self.eof = True
