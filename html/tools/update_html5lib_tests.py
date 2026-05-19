#!/usr/bin/env python3
"""Refresh html5lib-tests .dat files in resources/ and regenerate the
three wrapper files from a local html5lib-tests clone.

The pinned revision in html5lib_tests_revision controls what gets exported.
To upgrade: edit html5lib_tests_revision, then re-run this script.

  update_html5lib_tests.py [--repo PATH]

By default the script expects a local clone at ../../../html5lib-tests
(sibling of the WPT working tree).
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
WPT = TOOLS.parents[1]
REVISION_FILE = TOOLS / "html5lib_tests_revision"
PARSING = WPT / "html" / "syntax" / "parsing"
RESOURCES = PARSING / "resources"
WRAPPERS = ["url", "write", "write_single"]
DEFAULT_REPO = WPT.parent / "html5lib-tests"

DAT_PATH_RE = re.compile(r"^tree-construction/(scripted/)?(.+)\.dat$")
DATA_LINE_RE = re.compile(r"(?m)^#data$")
SCRIPT_OFF_LINE_RE = re.compile(r"(?m)^#script-off$")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo", type=Path, default=DEFAULT_REPO,
        help=f"path to a local html5lib-tests clone (default: {DEFAULT_REPO})",
    )
    args = parser.parse_args()

    revision = REVISION_FILE.read_text().strip()
    if not (args.repo / ".git").exists():
        print(f"error: {args.repo} is not a git repository", file=sys.stderr)
        return 1
    try:
        subprocess.check_call(
            ["git", "-C", str(args.repo), "cat-file", "-e", f"{revision}^{{commit}}"],
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        print(f"error: revision {revision} not in {args.repo}; run `git fetch` there.",
              file=sys.stderr)
        return 1

    paths = subprocess.check_output(
        ["git", "-C", str(args.repo), "ls-tree", "--name-only", "-r", revision, "tree-construction/"],
        text=True,
    ).splitlines()

    for old in sorted(RESOURCES.glob("*.dat")):
        old.unlink()

    runnable: list[str] = []
    skipped: list[str] = []
    for path in paths:
        m = DAT_PATH_RE.match(path)
        if not m:
            continue
        name = ("scripted_" if m.group(1) else "") + m.group(2)
        content = subprocess.check_output(
            ["git", "-C", str(args.repo), "show", f"{revision}:{path}"],
        )
        (RESOURCES / f"{name}.dat").write_bytes(content)
        text = content.decode("utf-8")
        if len(DATA_LINE_RE.findall(text)) > len(SCRIPT_OFF_LINE_RE.findall(text)):
            runnable.append(name)
        else:
            skipped.append(name)

    runnable.sort()
    print(f"  {len(runnable) + len(skipped)} .dat files written to resources/")
    if skipped:
        print(f"  not listed as variants (all #script-off): {', '.join(skipped)}")

    for kind in WRAPPERS:
        write_wrapper(PARSING / f"html5lib_{kind}.html", kind, runnable)
    print(f"  refreshed {len(WRAPPERS)} wrapper(s)")
    return 0


def write_wrapper(path: Path, run_type: str, names: list[str]) -> None:
    variants = "\n".join(f'<meta name="variant" content="?file={n}">' for n in names)
    path.write_text(f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HTML parser tests (run_type={run_type})</title>
<meta name="timeout" content="long">
{variants}
</head>
<body>
<h1>html5lib parser tests</h1>
<div id="log"></div>
<script src="/resources/testharness.js"></script>
<script src="/resources/testharnessreport.js"></script>
<script src="resources/common.js"></script>
<script src="resources/template.js"></script>
<script src="resources/test.js" data-run-type="{run_type}"></script>
</body>
</html>
""")


if __name__ == "__main__":
    sys.exit(main())
