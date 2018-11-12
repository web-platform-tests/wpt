import threading
import multiprocessing
from multiprocessing.managers import BaseManager

import pytest

Stash = pytest.importorskip("wptserve.stash").Stash

@pytest.fixture()
def add_cleanup():
    fns = []

    def add(fn):
        fns.append(fn)

    yield add

    for fn in fns:
        fn()

def test_delayed_lock(add_cleanup):
    """Ensure that delays in proxied Lock retrieval do not interfere with
    initialization in parallel threads."""

    class SlowLock(BaseManager):
        pass

    request_lock = multiprocessing.Lock()
    response_lock = multiprocessing.Lock()

    queue = multiprocessing.Queue()

    def handle_lock_request():
        request_lock.release()
        response_lock.acquire()
        return threading.Lock()

    SlowLock.register("get_dict", callable=lambda: {})
    SlowLock.register("Lock", callable=handle_lock_request)

    slowlock = SlowLock(("localhost", 4543), b"some key")
    slowlock.start()
    add_cleanup(lambda: slowlock.shutdown())

    def run(process_queue, request_lock, response_lock):
        def target(thread_queue):
            stash = Stash("/", ("localhost", 4543), b"some key")
            thread_queue.put(stash.lock is None)

        thread_queue = multiprocessing.Queue()
        first = threading.Thread(target=target, args=(thread_queue,))
        second = threading.Thread(target=target, args=(thread_queue,))

        request_lock.acquire()
        response_lock.acquire()
        first.start()

        request_lock.acquire()
        # First is now waiting for Lock

        second.start()

        # Allow the first to proceed
        response_lock.release()

        process_queue.put(thread_queue.get())
        process_queue.put(thread_queue.get())

    parallel = multiprocessing.Process(target=run,
                                       args=(queue, request_lock, response_lock))
    parallel.start()
    add_cleanup(lambda: parallel.terminate())

    assert [queue.get(), queue.get()] == [False, False], (
        "both instances had valid locks")

def test_delayed_dict(add_cleanup):
    """Ensure that delays in proxied `dict` retrieval do not interfere with
    initialization in parallel threads."""

    class SlowDict(BaseManager):
        pass

    request_lock = multiprocessing.Lock()
    response_lock = multiprocessing.Lock()

    queue = multiprocessing.Queue()

    def handle_dict_request():
        request_lock.release()
        response_lock.acquire()
        return {}

    SlowDict.register("get_dict", callable=handle_dict_request)
    SlowDict.register("Lock", callable=lambda: threading.Lock())

    slowdict = SlowDict(("localhost", 4543), b"some key")
    slowdict.start()
    add_cleanup(lambda: slowdict.shutdown())

    def run(process_queue, request_lock, response_lock):
        def target(thread_queue):
            stash = Stash("/", ("localhost", 4543), b"some key")
            thread_queue.put(stash.lock is None)

        thread_queue = multiprocessing.Queue()
        first = threading.Thread(target=target, args=(thread_queue,))
        second = threading.Thread(target=target, args=(thread_queue,))

        request_lock.acquire()
        response_lock.acquire()
        first.start()

        request_lock.acquire()
        # First is now waiting for Lock

        second.start()

        # Allow the first to proceed
        response_lock.release()

        process_queue.put(thread_queue.get())
        process_queue.put(thread_queue.get())

    parallel = multiprocessing.Process(target=run,
                                       args=(queue, request_lock, response_lock))
    parallel.start()
    add_cleanup(lambda: parallel.terminate())

    assert [queue.get(), queue.get()] == [False, False], (
        "both instances had valid locks")
