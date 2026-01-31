# mypy: allow-untyped-defs, allow-untyped-calls

import warnings
from os.path import join, dirname
from unittest import mock

import pytest

from .base import all_products, active_products
from .. import environment
from .. import products
from .. import wptcommandline

wpt_root = join(dirname(__file__), "..", "..", "..", "..")

test_paths = {"/": wptcommandline.TestRoot(wpt_root, wpt_root)}
environment.do_delayed_imports(None, test_paths)


@active_products("product")
def test_load_active_product(product):
    """test we can successfully load the product of the current testenv"""
    products.Product.from_product_name(product)
    # test passes if it doesn't throw


@all_products("product")
def test_load_all_products(product):
    """test every product either loads or throws ImportError"""
    with warnings.catch_warnings():
        # This acts to ensure that we don't get a DeprecationWarning here.
        warnings.filterwarnings(
            "error",
            message=r"Use Product\.from_product_name",
            category=DeprecationWarning,
        )
        try:
            products.Product.from_product_name(product)
        except ImportError:
            pass


@all_products("product")
def test_load_all_products_deprecated(product):
    """test every product causes a DeprecationWarning"""
    with pytest.deprecated_call(match=r"Use Product\.from_product_name"):
        try:
            products.Product({}, product)
        except ImportError:
            pass


@active_products("product", marks={
    "sauce": pytest.mark.skip("needs env extras kwargs"),
})
def test_server_start_config(product):
    product_data = products.Product.from_product_name(product)

    env_extras = product_data.get_env_extras()

    with mock.patch.object(environment.serve, "start") as start:
        with environment.TestEnvironment(test_paths,
                                         1,
                                         False,
                                         False,
                                         None,
                                         product_data.env_options,
                                         {"type": "none"},
                                         env_extras):
            start.assert_called_once()
            args = start.call_args
            config = args[0][1]
            if "server_host" in product_data.env_options:
                assert config["server_host"] == product_data.env_options["server_host"]
            else:
                assert config["server_host"] == config["browser_host"]
            assert isinstance(config["bind_address"], bool)


def test_default_if_none_descriptor_with_none() -> None:
    """Test that _DefaultIfNone descriptor converts None to default"""
    # Create a Product with run_info_extras=None (as happens in _from_dunder_wptrunner)
    product = products.Product(
        name="test",
        browser_classes={None: mock.MagicMock()},
        check_args=mock.MagicMock(),
        get_browser_kwargs=mock.MagicMock(),
        get_executor_kwargs=mock.MagicMock(),
        env_options={},
        get_env_extras=mock.MagicMock(),
        get_timeout_multiplier=mock.MagicMock(),
        executor_classes={},
        run_info_extras=None,  # This would fail without the descriptor
        update_properties=None,  # This would fail without the descriptor
    )

    # Verify that None was converted to the defaults
    assert callable(product.run_info_extras), \
        f"Expected callable run_info_extras, got {type(product.run_info_extras)}"
    assert product.update_properties == (["product"], {}), \
        f"Expected default update_properties, got {product.update_properties}"

    # Verify the defaults work correctly
    result = product.run_info_extras(mock.MagicMock())
    assert result == {}, f"Expected empty dict from default run_info_extras, got {result}"


def test_default_if_none_descriptor_with_provided_values() -> None:
    """Test that _DefaultIfNone descriptor preserves provided values"""
    def custom_run_info_extras(logger, **kwargs):
        return {"custom": "value"}

    custom_update_properties = (["custom"], {"prop": ["value"]})

    product = products.Product(
        name="test",
        browser_classes={None: mock.MagicMock()},
        check_args=mock.MagicMock(),
        get_browser_kwargs=mock.MagicMock(),
        get_executor_kwargs=mock.MagicMock(),
        env_options={},
        get_env_extras=mock.MagicMock(),
        get_timeout_multiplier=mock.MagicMock(),
        executor_classes={},
        run_info_extras=custom_run_info_extras,
        update_properties=custom_update_properties,
    )

    # Verify that provided values are preserved
    assert product.run_info_extras is custom_run_info_extras
    assert product.update_properties is custom_update_properties
