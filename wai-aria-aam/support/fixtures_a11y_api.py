import pytest
from sys import platform

def pid_from(capabilities):
    if capabilities['browserName'] == "chrome":
        return capabilities["goog:processID"], "chrome"
    if capabilities['browserName'] == "firefox":
        return capabilities["moz:processID"], "firefox"
    if capabilities['browserName'] == "servo":
        return 0, "servo"

@pytest.fixture
def default_timeout(full_configuration):
    if not full_configuration['timeout'] or full_configuration['timeout'] == 0:
        return 60
    return full_configuration['timeout'] * .5

@pytest.fixture
def atspi(session, default_timeout):
    if platform != "linux":
        return

    from .atspi_wrapper import AtspiWrapper

    pid, product_name = pid_from(session.capabilities)
    return AtspiWrapper(pid, product_name, default_timeout)

@pytest.fixture
def axapi(session, default_timeout):
    if platform != "darwin":
        return

    from .axapi_wrapper import AxapiWrapper

    pid, product_name = pid_from(session.capabilities)
    return AxapiWrapper(pid, product_name, default_timeout)

@pytest.fixture
def uia(session):
    if platform != "win32":
        return

    # TODO: Make UiaWrapper and return it


@pytest.fixture
def ia2(session, default_timeout):
    if platform != "win32":
        return

    from .ia2_wrapper import Ia2Wrapper

    pid, product_name = pid_from(session.capabilities)
    return Ia2Wrapper(pid, product_name, default_timeout)
