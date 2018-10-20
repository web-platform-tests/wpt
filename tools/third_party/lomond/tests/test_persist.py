from lomond.persist import persist
from lomond import events


class FakeEvent(object):
    def wait(self, wait_for=None):
        return True


class FakeWebSocket(object):
    def connect(self, poll=None, ping_rate=None, ping_timeout=None):
        yield events.Connecting('ws://localhost:1234/')
        yield events.ConnectFail('test')


def persist_testing_helper(mocker, validate_function, websocket_connect=None):
    # ok. First, we start off by calling .spy on our fake function, so that
    # we could verify that it was called
    mocker.spy(FakeEvent, 'wait')
    # now, we patch the import path to threading.Event and replace it with
    # our own FakeEvent. Therefore, whenever persist.py will try to import
    # threading.Event, it will actually import FakeEvent
    mocker.patch('lomond.persist.threading.Event', FakeEvent)
    # great, now a simple websocket imposter
    websocket = FakeWebSocket()
    if websocket_connect:
        websocket.connect = websocket_connect

    yielded_events = list(persist(websocket))

    # the sole fact that we ended up in this line means that the event
    # method was called, but we can nevertheless check it
    assert FakeEvent.wait.call_count == 1

    # and now we can validate the events.
    validate_function(yielded_events)


def test_persist_with_nonexisting_server(mocker):
    def validate_events(_events):
        # the server doesn't exist, so we expect 3 entries:
        assert len(_events) == 3
        # 0/ Connecting
        assert isinstance(_events[0], events.Connecting)
        # 1/ a ConnectFail - because the server doesn't exist ..
        assert isinstance(_events[1], events.ConnectFail)
        # 2/ and a BackOff which means that we are ready to start a new
        # iteration.
        assert isinstance(_events[2], events.BackOff)

    persist_testing_helper(mocker, validate_events)


def test_emulate_ready_event(mocker):
    def successful_connect(poll=None, ping_rate=None, ping_timeout=None):
        yield events.Connecting('ws://localhost:1234')
        yield events.Ready(None, None, None)

    def validate_events(_events):
        assert len(_events) == 3
        assert isinstance(_events[0], events.Connecting)
        assert isinstance(_events[1], events.Ready)
        assert isinstance(_events[2], events.BackOff)

    persist_testing_helper(mocker, validate_events, successful_connect)
