import os
import sys

from os.path import join, dirname

import pytest

sys.path.insert(0, join(dirname(__file__), "..", ".."))

from wptrunner import products

current_tox_env = None
current_tox_env_split = None
if "CURRENT_TOX_ENV" in os.environ:
    current_tox_env = os.environ["CURRENT_TOX_ENV"]
    current_tox_env_split = current_tox_env.split("-")

product_env_map = {
    "chrome_android": "chrome",
    "servodriver": "servo",
}

@pytest.mark.parametrize("product", [
    "chrome",
    "chrome_android",
    "edge",
    "firefox",
    "ie",
    "opera",
    "sauce",
    "servo",
    "servodriver"
])
def test_load_product(product):
    try:
        products.load_product({}, product)
    except ImportError as e:
        if (current_tox_env and
                product_env_map.get(product, product) in current_tox_env_split):
            raise e
        else:
            pytest.skip("import failed loading product")
