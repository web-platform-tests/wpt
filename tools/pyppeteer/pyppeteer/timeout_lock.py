import threading
from six.moves import queue

class TimeoutLock(object):
    '''A thread synchronization primitive modeled after the built-in
    `threading.Lock`. A `timeout` value must be provided during acquisition; if
    the lock cannot be acquired within that time, the call will raise an
    Exception.'''
    def __init__(self):
        self._queue = queue.Queue(1)

    def acquire(self, timeout):
        '''
        :param timeout: duration in seconds to block before aborting the
                        operation and raising an Exception
        '''
        try:
            self._queue.put(None, True, timeout)
        except queue.Full:
            raise Exception('Lock timed out')

    def release(self):
        try:
            self._queue.get(False)
        except queue.Empty:
            raise threading.ThreadError('release unlocked lock')

    def __enter__(self):
        self.acquire()

    def __exit__(self, type, value, traceback):
        self.release()
