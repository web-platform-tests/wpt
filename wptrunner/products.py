import os
import importlib

here = os.path.join(os.path.split(__file__)[0])

def iter_products():
    product_dir = os.path.join(here, "browsers")
    plugin_files = [os.path.splitext(x)[0] for x in os.listdir(product_dir)
                    if not x[0] in ("_", ".", "#") and x.endswith(".py")]

    for fn in plugin_files:
        mod = importlib.import_module("wptrunner.browsers." + fn)
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

    if browser_cls is None:
        raise ValueError("Unknown product %s" % product)

    return check_args, browser_cls, browser_kwargs, executor_classes, executor_kwargs, env_options
