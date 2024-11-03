import shutil
import subprocess
from argparse import ArgumentParser
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tools.wpt.virtualenv import Virtualenv


_wpt_tools = Path(__file__).parent.parent.resolve()


def sync(venv: "Virtualenv", path: Path) -> None:
    return subprocess.run(
        [shutil.which("vendoring", path=venv.bin_path), "sync"],
        check=True,
        cwd=_wpt_tools,
    )


def get_parser() -> ArgumentParser:
    parser = ArgumentParser("Manage vendored Python in tools/third_party")
    subparsers = parser.add_subparsers(dest="subcommand")

    sync = subparsers.add_parser("sync", help="Install requirements_vendor.txt")

    return parser


def run(venv: "Virtualenv", subcommand: str, **kwargs: Any) -> None:
    if subcommand == "sync":
        sync(venv, _wpt_tools)
    else:
        raise ValueError("Unknown subcommand")
