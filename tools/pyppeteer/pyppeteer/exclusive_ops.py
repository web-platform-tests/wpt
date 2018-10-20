import contextlib
import threading

from six.moves import queue

class NameError(Exception):
    pass

class ExclusiveOps():
    '''Thread-safe tracker for exclusive operations. An operation is described
    by a unique name. The `start` method blocks the current thread until some
    other thread invokes the `complete` method. While an operation is in
    progress, any attempt to `start` another operation with the same name will
    cause the blocked thread to raise an exception.

    This class was designed as an abstraction around page navigation with the
    Chrome DevTools protocol.'''
    def __init__(self):
        self._operations = {}
        self._operations_lock = threading.Lock()

    @contextlib.contextmanager
    def start(self, name):
        with self._operations_lock:
            if name in self._operations:
                self._operations.pop(name).cancel('Operation interrupted')

            operation = Operation()
            self._operations[name] = operation

        yield

        operation.wait()

    def complete(self, name):
        with self._operations_lock:
            if name not in self._operations:
                raise NameError('Unrecognized operation name: {}'.format(name))

            self._operations.pop(name).complete()

class Operation():
    def __init__(self):
        self._result = queue.Queue()

    def wait(self):
        value = self._result.get()

        if value:
            raise Exception(value)

    def complete(self):
        self._result.put(None)

    def cancel(self, reason):
        self._result.put(reason)
