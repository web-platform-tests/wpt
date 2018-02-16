import os
import sys

here = os.path.split(__file__)[0]
repo_root = os.path.abspath(os.path.join(here, os.pardir, os.pardir, os.pardir))

sys.path.insert(0, repo_root)

from tools import localpaths as __localpaths

sys.path.remove(repo_root)
