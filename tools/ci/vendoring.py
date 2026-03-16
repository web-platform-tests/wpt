import shlex
import shutil
import subprocess
import sys
from argparse import ArgumentParser
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import TYPE_CHECKING, Any, Iterable, Iterator, Set

from packaging.requirements import Requirement
from packaging.utils import NormalizedName, canonicalize_name

if TYPE_CHECKING:
    from tools.wpt.virtualenv import Virtualenv


_wpt_tools = Path(__file__).parent.parent.resolve()


def sync(venv: "Virtualenv", path: Path) -> None:
    vendoring = shutil.which("vendoring", path=venv.bin_path)
    if vendoring is None:
        raise Exception("vendoring not found")

    subprocess.run(
        [vendoring, "sync"],
        check=True,
        cwd=_wpt_tools,
    )


def update(
    venv: "Virtualenv", src_file: Path, output_file: Path, *, upgrade: bool = False
) -> None:
    uv = shutil.which("uv", path=venv.bin_path)
    if uv is None:
        raise Exception("uv not found")

    common_parent = max(
        set(src_file.resolve().parents) & set(output_file.resolve().parents),
        key=lambda p: len(p.parents),
    )
    subprocess.run(
        [
            uv,
            "pip",
            "compile",
            "--quiet",
            "--custom-compile-command",
            shlex.join(sys.argv),
            "--annotation-style",
            "split",
            "--universal",
            "--fork-strategy",
            "fewest",
            "--python-version",
            "3.8",
            str(src_file.resolve()),
            "-o",
            str(output_file.resolve()),
        ] + (["--upgrade"] if upgrade else []),
        check=True,
        cwd=common_parent,
    )

    with NamedTemporaryFile("w", dir=output_file.parent, delete=False) as new_f:
        with open(output_file, "r") as old_f:
            new_f.writelines(remove_markers(old_f))
        Path(new_f.name).replace(output_file)


def remove_markers(requirements_lines: Iterable[str]) -> Iterator[str]:
    seen: Set[NormalizedName] = set()
    for line in requirements_lines:
        requirement, comment, comment_content = line.partition("#")

        if requirement:
            lstripped = requirement.lstrip()
            stripped = lstripped.rstrip()

            if stripped:
                leading_ws = requirement[:len(requirement) - len(lstripped)]
                trailing_ws = lstripped[len(stripped):]
                req = Requirement(stripped)
                req.marker = None
                canonicalized_name = canonicalize_name(req.name)
                if canonicalized_name in seen:
                    raise ValueError(
                        f"{canonicalized_name} has multiple versions varying by markers"
                    )
                yield f"{leading_ws}{req}{trailing_ws}{comment}{comment_content}"
            else:
                yield f"{requirement}{comment}{comment_content}"
        else:
            yield f"{requirement}{comment}{comment_content}"


def get_parser() -> ArgumentParser:
    parser = ArgumentParser("Manage vendored Python in tools/third_party")
    subparsers = parser.add_subparsers(dest="subcommand")

    subparsers.add_parser(
        "sync",
        help="Install requirements_vendor.txt",
    )

    update = subparsers.add_parser(
        "update",
        help="Update requirements_vendor.txt",
    )
    update.add_argument(
        "-U",
        "--upgrade",
        action="store_true",
        help="Allow package upgrades",
    )

    return parser


def run(venv: "Virtualenv", subcommand: str, **kwargs: Any) -> None:
    if subcommand == "sync":
        sync(venv, _wpt_tools)
    elif subcommand == "update":
        update(
            venv,
            _wpt_tools / "requirements_vendor.in",
            _wpt_tools / "requirements_vendor.txt",
            upgrade=kwargs["upgrade"],
        )
    else:
        raise ValueError("Unknown subcommand")
