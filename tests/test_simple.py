"""Quick'n'dirty unit tests for provided fixtures and markers."""
import asyncio

import pytest
import pytest_asyncio.plugin


async def async_coro():
    await asyncio.sleep(0)
    return "ok"


def test_event_loop_fixture(event_loop):
    """Test the injection of the event_loop fixture."""
    assert event_loop
    ret = event_loop.run_until_complete(async_coro())
    assert ret == "ok"


@pytest.mark.asyncio
async def test_asyncio_marker():
    """Test the asyncio pytest marker."""
    await asyncio.sleep(0)


@pytest.mark.xfail(reason="need a failure", strict=True)
@pytest.mark.asyncio
def test_asyncio_marker_fail():
    assert False


@pytest.mark.asyncio
def test_asyncio_marker_with_default_param(a_param=None):
    """Test the asyncio pytest marker."""
    yield  # sleep(0)


@pytest.mark.asyncio
async def test_unused_port_fixture(unused_tcp_port, event_loop):
    """Test the unused TCP port fixture."""

    async def closer(_, writer):
        writer.close()

    server1 = await asyncio.start_server(closer, host="localhost", port=unused_tcp_port)

    with pytest.raises(IOError):
        await asyncio.start_server(closer, host="localhost", port=unused_tcp_port)

    server1.close()
    await server1.wait_closed()


@pytest.mark.asyncio
async def test_unused_port_factory_fixture(unused_tcp_port_factory, event_loop):
    """Test the unused TCP port factory fixture."""

    async def closer(_, writer):
        writer.close()

    port1, port2, port3 = (
        unused_tcp_port_factory(),
        unused_tcp_port_factory(),
        unused_tcp_port_factory(),
    )

    server1 = await asyncio.start_server(closer, host="localhost", port=port1)
    server2 = await asyncio.start_server(closer, host="localhost", port=port2)
    server3 = await asyncio.start_server(closer, host="localhost", port=port3)

    for port in port1, port2, port3:
        with pytest.raises(IOError):
            await asyncio.start_server(closer, host="localhost", port=port)

    server1.close()
    await server1.wait_closed()
    server2.close()
    await server2.wait_closed()
    server3.close()
    await server3.wait_closed()


def test_unused_port_factory_duplicate(unused_tcp_port_factory, monkeypatch):
    """Test correct avoidance of duplicate ports."""
    counter = 0

    def mock_unused_tcp_port():
        """Force some duplicate ports."""
        nonlocal counter
        counter += 1
        if counter < 5:
            return 10000
        else:
            return 10000 + counter

    monkeypatch.setattr(pytest_asyncio.plugin, "_unused_tcp_port", mock_unused_tcp_port)

    assert unused_tcp_port_factory() == 10000
    assert unused_tcp_port_factory() > 10000


class TestMarkerInClassBasedTests:
    """Test that asyncio marked functions work for methods of test classes."""

    @pytest.mark.asyncio
    async def test_asyncio_marker_with_explicit_loop_fixture(self, event_loop):
        """Test the "asyncio" marker works on a method in a class-based test with explicit loop fixture."""
        ret = await async_coro()
        assert ret == "ok"

    @pytest.mark.asyncio
    async def test_asyncio_marker_with_implicit_loop_fixture(self):
        """Test the "asyncio" marker works on a method in a class-based test with implicit loop fixture."""
        ret = await async_coro()
        assert ret == "ok"


class TestEventLoopStartedBeforeFixtures:
    @pytest.fixture
    async def loop(self):
        return asyncio.get_event_loop()

    @staticmethod
    def foo():
        return 1

    @pytest.mark.asyncio
    async def test_no_event_loop(self, loop):
        assert await loop.run_in_executor(None, self.foo) == 1

    @pytest.mark.asyncio
    async def test_event_loop_after_fixture(self, loop, event_loop):
        assert await loop.run_in_executor(None, self.foo) == 1

    @pytest.mark.asyncio
    async def test_event_loop_before_fixture(self, event_loop, loop):
        assert await loop.run_in_executor(None, self.foo) == 1


@pytest.mark.asyncio
async def test_no_warning_on_skip():
    pytest.skip("Test a skip error inside asyncio")


def test_async_close_loop(event_loop):
    event_loop.close()
    return "ok"
