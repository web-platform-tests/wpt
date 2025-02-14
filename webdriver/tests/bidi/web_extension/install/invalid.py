import pytest
import webdriver.bidi.error as error

from tests.support.helpers import get_addon_path

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("value", [None, False, 42, [], ""])
async def test_params_extension_data_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData=value
        )


async def test_params_extension_data_invalid_value(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={}
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_extension_data_type_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={ "type": value }
        )


@pytest.mark.parametrize("value", ["", "unknown-type"])
async def test_params_extension_data_type_invalid_value(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={ "type": value }
        )


@pytest.mark.parametrize("value", ["path", "archivePath"])
async def test_params_extension_data_path_missing(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={ "type": value }
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
@pytest.mark.parametrize("data_type", ["path", "archivePath"])
async def test_params_extension_data_path_invalid_type(bidi_session, data_type, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={ "type": data_type, "path": value }
        )


@pytest.mark.parametrize("value", ["", "invalid path"])
@pytest.mark.parametrize("data_type", ["path", "archivePath"])
async def test_params_extension_data_path_invalid_value(bidi_session, data_type, value):
    with pytest.raises(error.UnknownErrorException):
        await bidi_session.web_extension.install(
            extensionData={ "type": data_type, "path": value }
        )


async def test_params_extension_data_archive_path_invalid_webextension(bidi_session, addon_data):
    with pytest.raises(error.InvalidWebExtensionException):
        await bidi_session.web_extension.install(
            extensionData={"type": "archivePath",
                           "path": addon_data["archivePathInvalid"]}
        )


async def test_params_extension_data_path_invalid_webextension(bidi_session, addon_data):
    with pytest.raises(error.InvalidWebExtensionException):
        await bidi_session.web_extension.install(
            extensionData={"type": "path", "path": addon_data["unsigned.xpi"]}
        )


async def test_params_extension_data_value_missing(bidi_session):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={ "type": "base64" }
        )


@pytest.mark.parametrize("value", [None, False, 42, {}, []])
async def test_params_extension_data_value_invalid_type(bidi_session, value):
    with pytest.raises(error.InvalidArgumentException):
        await bidi_session.web_extension.install(
            extensionData={ "type": "base64", "value": value }
        )


async def test_params_extension_data_value_invalid_value(bidi_session):
    with pytest.raises(error.UnknownErrorException):
        await bidi_session.web_extension.install(
            extensionData={ "type": "base64", "value": "not a base64" }
        )


@pytest.mark.parametrize("value", ["", "dGVzdA=="])
async def test_params_extension_data_value_invalid_webextension(bidi_session, value):
    with pytest.raises(error.InvalidWebExtensionException):
        await bidi_session.web_extension.install(
            extensionData={ "type": "base64", "value": value }
        )
