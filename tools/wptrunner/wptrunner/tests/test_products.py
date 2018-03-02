import os
import sys

from os.path import join, dirname

import pytest

from .base import all_products, active_products

from wptrunner import products


@active_products("product")
def test_load_active_product(product):
    """test we can successfully load the product of the current testenv"""
    products.load_product({}, product)
    # test passes if it doesn't throw


@all_products("product")
def test_load_all_products(product):
    """test every product either loads or throws ImportError"""
    try:
        products.load_product({}, product)
    except ImportError:
        pass
