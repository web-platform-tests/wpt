import pytest
from sys import platform

linux = pytest.mark.skipif(platform != "linux", reason="PRECONDITION_FAILED")

mac = pytest.mark.skipif(platform != "darwin", reason="PRECONDITION_FAILED")

windows = pytest.mark.skipif(platform != "win32", reason="PRECONDITION_FAILED")
