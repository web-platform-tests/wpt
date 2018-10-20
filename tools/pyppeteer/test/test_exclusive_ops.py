import threading

import pytest
from six.moves import queue, xrange

from pyppeteer import exclusive_ops

def target(ps, topic, status):
    try:
        with ps.start(topic):
            status.put('{} waiting'.format(topic))
    except Exception:
        status.put('{} interrupted'.format(topic))
    else:
        status.put('{} completed'.format(topic))

def test_normal():
    ps = exclusive_ops.ExclusiveOps()
    status = queue.Queue()

    threading.Thread(target=target, args=(ps, 'a', status)).start()

    assert status.get(timeout=10) == 'a waiting'

    ps.complete('a')

    assert status.get(timeout=10) == 'a completed'

def test_interrupt():
    ps = exclusive_ops.ExclusiveOps()
    status = queue.Queue()

    threading.Thread(target=target, args=(ps, 'b', status)).start()

    assert status.get(timeout=10) == 'b waiting'

    threading.Thread(target=target, args=(ps, 'b', status)).start()

    s = set([status.get(timeout=10), status.get(timeout=10)])

    try:
        assert s == set(['b waiting', 'b interrupted'])
    finally:
        ps.complete('b')

    assert status.get(timeout=10) == 'b completed'

def test_concurrent():
    ps = exclusive_ops.ExclusiveOps()
    status = queue.Queue()

    threading.Thread(target=target, args=(ps, 'c', status)).start()
    threading.Thread(target=target, args=(ps, 'd', status)).start()

    waiting = set([status.get(timeout=10), status.get(timeout=10)])
    assert waiting == set(['c waiting', 'd waiting'])

    ps.complete('d')

    assert status.get(timeout=10) == 'd completed'

    ps.complete('c')

    assert status.get(timeout=10) == 'c completed'

def test_serial():
    ps = exclusive_ops.ExclusiveOps()
    status = queue.Queue()

    for _ in xrange(10):
        threading.Thread(target=target, args=(ps, 'e', status)).start()

        assert status.get(timeout=10) == 'e waiting'

        ps.complete('e')

        assert status.get(timeout=10) == 'e completed'

def test_unrecognized_name():
    ps = exclusive_ops.ExclusiveOps()

    with pytest.raises(exclusive_ops.NameError):
        ps.complete('f')
