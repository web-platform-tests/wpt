import os
import sys

here = os.path.abspath(os.path.dirname(__file__))

sys.path.insert(0, os.path.join(here))
sys.path.insert(0, os.path.join(here, "wptserve"))
sys.path.insert(0, os.path.join(here, "third_party", "pywebsocket3"))
sys.path.insert(0, os.path.join(here, "webdriver"))
sys.path.insert(0, os.path.join(here, "wptrunner"))

# We can't import six until we've set the path above.
from six import ensure_text
repo_root = ensure_text(os.path.abspath(os.path.join(here, os.pardir)))
