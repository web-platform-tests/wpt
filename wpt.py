"""
This file exists to allow `python wpt <command>` to work on Windows.

References:
- https://github.com/web-platform-tests/wpt/pull/6907
- https://github.com/web-platform-tests/wpt/issues/23095
"""

import os

def main():
    abspath = os.path.abspath(__file__)
    os.chdir(os.path.dirname(abspath))
    with open("wpt", "r", encoding="utf-8") as f:
        code = f.read()
    exec(compile(code, "wpt", "exec"))

if __name__ == "__main__":
    main()

