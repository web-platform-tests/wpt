# SPDX-License-Identifier: MIT


from importlib import metadata

import pytest

import attr
import attrs


@pytest.fixture(name="mod", params=(attr, attrs))
def _mod(request):
    return request.param


class TestLegacyMetadataHack:
    def test_version(self, mod, recwarn):
        """
        __version__ returns the correct version and doesn't warn.
        """
        assert metadata.version("attrs") == mod.__version__

        assert [] == recwarn.list

    def test_does_not_exist(self, mod):
        """
        Asking for unsupported dunders raises an AttributeError.
        """
        with pytest.raises(
            AttributeError,
            match=f"module {mod.__name__} has no attribute __yolo__",
        ):
            mod.__yolo__

    def test_version_info(self, recwarn, mod):
        """
        ___version_info__ is not deprecated, therefore doesn't raise a warning
        and parses correctly.
        """
        assert isinstance(mod.__version_info__, attr.VersionInfo)
        assert [] == recwarn.list
