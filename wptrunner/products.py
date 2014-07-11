# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import importlib

from .browsers import product_list

def iter_products():
    here = os.path.join(os.path.split(__file__)[0])
    product_dir = os.path.join(here, "browsers")

    for product in product_list:
        mod = importlib.import_module("wptrunner.browsers." + product)
        if hasattr(mod, "__wptrunner__"):
            yield mod.__wptrunner__["product"], mod


def load_product(product):
    '''find all files in the plugin directory and imports them'''

    for name, mod in iter_products():
        if name == product:
            data = mod.__wptrunner__

            check_args = getattr(mod, data["check_args"])
            browser_cls = getattr(mod, data["browser"])
            browser_kwargs = getattr(mod, data["browser_kwargs"])
            executor_kwargs = getattr(mod, data["executor_kwargs"])
            env_options = getattr(mod, data["env_options"])()

            executor_classes = {}
            for test_type, cls_name in data["executor"].iteritems():
                cls = getattr(mod, cls_name)
                executor_classes[test_type] = cls

            break
    else:
        raise ValueError("Unknown product %s" % product)

    return check_args, browser_cls, browser_kwargs, executor_classes, executor_kwargs, env_options
