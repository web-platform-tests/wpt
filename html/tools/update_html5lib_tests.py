#!/usr/bin/env python3
"""Refresh html5lib-tests .dat files in resources/ and regenerate the
three wrapper files at the pinned upstream revision.

The pinned revision lives in html5lib_tests_revision. To upgrade: edit
that file, then re-run this script.

  update_html5lib_tests.py [--repo PATH]

By default html5lib-tests is cloned fresh into a tempdir. Pass --repo
PATH to reuse a local clone (must already contain the pinned revision).
"""

from __future__ import annotations

import argparse
import contextlib
import re
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
WPT = TOOLS.parents[1]
REVISION_FILE = TOOLS / "html5lib_tests_revision"
PARSING = WPT / "html" / "syntax" / "parsing"
RESOURCES = PARSING / "resources"
WRAPPERS = ["url", "write", "write_single"]
UPSTREAM = "https://github.com/html5lib/html5lib-tests.git"

DAT_PATH_RE = re.compile(r"^tree-construction/(scripted/)?(.+)\.dat$")
DATA_LINE_RE = re.compile(rb"(?m)^#data$")
SCRIPT_OFF_LINE_RE = re.compile(rb"(?m)^#script-off$")


def has_revision(path: Path, revision: str) -> bool:
    try:
        subprocess.check_call(
            ["git", "-C", str(path), "cat-file", "-e", f"{revision}^{{commit}}"],
            stderr=subprocess.DEVNULL,
        )
        return True
    except subprocess.CalledProcessError:
        return False


@contextlib.contextmanager
def open_repo(repo: Path | None, revision: str):
    if repo is not None:
        if not (repo / ".git").exists() or not has_revision(repo, revision):
            print(f"error: {repo} does not contain revision {revision}; "
                  f"run `git fetch` there or omit --repo to clone fresh.",
                  file=sys.stderr)
            sys.exit(1)
        yield repo
        return
    with tempfile.TemporaryDirectory() as tmp:
        clone = Path(tmp) / "html5lib-tests"
        print(f"  cloning html5lib-tests into {clone}…")
        subprocess.check_call(["git", "clone", "--no-checkout", UPSTREAM, str(clone)])
        if not has_revision(clone, revision):
            print(f"error: revision {revision} not on origin", file=sys.stderr)
            sys.exit(1)
        yield clone


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo", type=Path, default=None,
        help="reuse a local html5lib-tests clone instead of cloning fresh",
    )
    args = parser.parse_args()

    revision = REVISION_FILE.read_text().strip()

    with open_repo(args.repo, revision) as repo:
        paths = subprocess.check_output(
            ["git", "-C", str(repo), "ls-tree", "--name-only", "-r", revision, "tree-construction/"],
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
                ["git", "-C", str(repo), "show", f"{revision}:{path}"],
            )
            (RESOURCES / f"{name}.dat").write_bytes(content)
            if len(DATA_LINE_RE.findall(content)) > len(SCRIPT_OFF_LINE_RE.findall(content)):
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
