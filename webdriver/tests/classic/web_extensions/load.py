import os
import pytest

from base64 import b64encode
from shutil import copyfileobj
from tempfile import mkdtemp
from tests.support.asserts import assert_error, assert_success
from zipfile import ZipFile

def load_extension(session, parameters):
    return session.transport.send(
        "POST", "session/%s/webextension" % session.session_id,
        {"type": parameters.get("type"), "value": parameters.get("value")})


def copy_dir_into_zip(source, dest):
    with ZipFile(dest, "w") as zf:
        for root, _, files in os.walk(source):
            for f in files:
                path = os.path.join(root, f)
                with open(path, "rb") as fd:
                    with zf.open(os.path.relpath(path, source), "w") as fd2:
                        copyfileobj(fd, fd2)


@pytest.fixture(params=[
    ("path", os.path.join(os.path.dirname(__file__), "resources/extension/")),
    ("archivePath", os.path.join(os.path.dirname(__file__), "resources/extension/")),
    ("base64", os.path.join(os.path.dirname(__file__), "resources/extension/"))
])
def extension(request):
    if request.param[0] == "path":
        return {
            "type": request.param[0],
            "value": request.param[1],
        }

    elif request.param[0] == "archivePath":
        zip_path = os.path.join(mkdtemp(), "extension.zip")
        copy_dir_into_zip(request.param[1], zip_path)
        return {
            "type": request.param[0],
            "value": zip_path,
        }

    elif request.param[0] == "base64":
        zip_path = os.path.join(mkdtemp(), "extension.zip")
        copy_dir_into_zip(request.param[1], zip_path)
        with open(zip_path, "rb") as f:
            encoded = b64encode(f.read()).decode("utf-8")

        return {
            "type": request.param[0],
            "value": encoded,
        }

    else:
        raise NotImplementedError(
            "Unexpected param, unable to return requested extension"
        )


def test_no_top_browsing_context(session, closed_window):
    extension = {
        "type": "path",
        "value": "/"
    }

    response = load_extension(session, extension)
    assert_error(response, "no such window")


def test_null_type_parameter(session):
    extension = {
        "value": "/"
    }

    response = load_extension(session, extension)
    assert_error(response, "invalid argument")


def test_invalid_type_parameter(session):
    extension = {
        "type": "invalid",
        "value": "/"
    }

    response = load_extension(session, extension)
    assert_error(response, "invalid argument")


def test_null_value_parameter(session):
    extension = {
        "type": "path"
    }

    response = load_extension(session, extension)
    assert_error(response, "invalid argument")


def test_invalid_zip(session):
    extension = {
        "type": "archivePath",
        "value": os.path.join(os.path.dirname(__file__), "resources/invalid_extension.zip")
    }

    response = load_extension(session, extension)
    assert_error(response, "unable to load extension")


def test_invalid_base64(session):
    extension = {
        "type": "base64",
        "value": "invalid base64"
    }

    response = load_extension(session, extension)
    assert_error(response, "unable to load extension")


@pytest.mark.parametrize("hint,value", [
    ("path", "/invalid/path/"),
    ("archivePath", "/invalid/path/extension.zip")
])
def test_invalid_path(session, hint, value):
    extension = {
        "type": hint,
        "value": value
    }

    response = load_extension(session, extension)
    assert_error(response, "unable to load extension")


def test_load_extension(session, extension):
    response = load_extension(session, extension)
    assert_success(response)

    assert "value" in response.body
    assert isinstance(response.body["value"], dict)
    assert "extensionId" in response.body["value"]
    assert isinstance(response.body["value"]["extensionId"], str)
    assert response.body["value"]["extensionId"]
