#!/usr/bin/env python
from importlib.metadata import version as get_version

from packaging.version import parse

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.intersphinx",
    "sphinx_autodoc_typehints",
]

templates_path = ["_templates"]
source_suffix = ".rst"
master_doc = "index"
project = "cbor2"
author = "Alex Grönholm"
copyright = "2016, " + author

v = parse(get_version(project))
version = v.base_version
release = v.public

language = "en"

exclude_patterns = ["_build"]
pygments_style = "sphinx"
highlight_language = "default"
todo_include_todos = False
autodoc_default_options = {"members": True}
autodoc_mock_imports = ["typing_extensions"]

html_theme = "sphinx_rtd_theme"
htmlhelp_basename = project.replace("-", "") + "doc"

intersphinx_mapping = {"python": ("https://docs.python.org/", None)}
