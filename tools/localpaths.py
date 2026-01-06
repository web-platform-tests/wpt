import os
import sys

here = os.path.abspath(os.path.dirname(__file__))
repo_root = os.path.abspath(os.path.join(here, os.pardir))

sys.path.insert(0, os.path.join(here))
sys.path.insert(0, os.path.join(here, "wptserve"))
sys.path.insert(0, os.path.join(here, "third_party"))
sys.path.insert(0, os.path.join(here, "webdriver"))
sys.path.insert(0, os.path.join(here, "wptrunner"))
sys.path.insert(0, os.path.join(here, "webtransport"))
sys.path.insert(0, os.path.join(here, "third_party_modified", "mozlog"))
