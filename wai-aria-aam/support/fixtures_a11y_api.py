import pytest
from sys import platform

from .atspi_wrapper import AtspiWrapper;


def pid_from(capabilities):
    if capabilities['browserName'] == "chrome":
        return capabilities["goog:processID"], "chrome"
    if capabilities['browserName'] == "firefox":
        return capabilities["moz:processID"], "firefox"
    if capabilities['browserName'] == "servo":
        return 0, "servo"


# TODO: `session` is function scoped, which means atspi has to be,
# which means each test that uses the `atspi` fixture will find the browser
# in the accessibility API all over again. If we want something different
# we will have to make our own `session` fixture.
@pytest.fixture
def atspi(session):
    if platform != "linux":
        return

    pid, product_name = pid_from(session.capabilities)
    return AtspiWrapper(pid, product_name)


@pytest.fixture
def axapi(session):
    if platform != "darwin":
        return

    # TODO: Make AxapiWrapper and return it


@pytest.fixture
def uia(session):
    if platform != "win32":
        return

    # TODO: Make UiaWrapper and return it


@pytest.fixture
def ia2(session):
    if platform != "win32":
        return

    # TODO: Make ia2Wrapper and return it
