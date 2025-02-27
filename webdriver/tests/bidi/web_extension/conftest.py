import pytest
from tests.support.helpers import get_extension_path, get_base64_for_extension_file


extensions_by_browser = {
    "firefox": {
        "id": "1FC7D53C-0B0A-49E7-A8C0-47E77496A919@web-platform-tests.org",
        "path": get_extension_path("firefox/unpacked/"),
        "archivePath": get_extension_path("firefox/signed.xpi"),
        "archivePathInvalid": get_extension_path("firefox/invalid.xpi"),
        "base64": get_base64_for_extension_file("firefox/signed.xpi"),
    },
    "chrome": {
        "id": "1FC7D53C-0B0A-49E7-A8C0-47E77496A919@web-platform-tests.org",
        "path": get_extension_path("firefox/unpacked/"),
        "archivePath": get_extension_path("firefox/signed.xpi"),
        "archivePathInvalid": get_extension_path("firefox/invalid.xpi"),
        "base64": get_base64_for_extension_file("firefox/signed.xpi"),
    }
}


@pytest.fixture
def extension_data(current_session):
    browser_name = current_session.capabilities["browserName"]

    return extensions_by_browser[browser_name]
