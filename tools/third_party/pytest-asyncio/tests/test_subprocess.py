"""Tests for using subprocesses in tests."""
import asyncio
import asyncio.subprocess
import sys

import pytest

if sys.platform == "win32":
    # The default asyncio event loop implementation on Windows does not
    # support subprocesses. Subprocesses are available for Windows if a
    # ProactorEventLoop is used.
    @pytest.yield_fixture()
    def event_loop():
        loop = asyncio.ProactorEventLoop()
        yield loop
        loop.close()


@pytest.mark.asyncio(forbid_global_loop=False)
async def test_subprocess(event_loop):
    """Starting a subprocess should be possible."""
    proc = await asyncio.subprocess.create_subprocess_exec(
        sys.executable, "--version", stdout=asyncio.subprocess.PIPE
    )
    await proc.communicate()


@pytest.mark.asyncio(forbid_global_loop=True)
async def test_subprocess_forbid(event_loop):
    """Starting a subprocess should be possible."""
    proc = await asyncio.subprocess.create_subprocess_exec(
        sys.executable, "--version", stdout=asyncio.subprocess.PIPE
    )
    await proc.communicate()
