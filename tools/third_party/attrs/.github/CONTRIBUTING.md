# How To Contribute

> [!IMPORTANT]
> This document is mainly to help you to get started by codifying tribal knowledge and expectations and make it more accessible to everyone.
> But don't be afraid to open half-finished PRs and ask questions if something is unclear!


## Support

In case you'd like to help out but don't want to deal with GitHub, there's a great opportunity:
help your fellow developers on [Stack Overflow](https://stackoverflow.com/questions/tagged/python-attrs)!

The official tag is `python-attrs` and helping out in support frees us up to improve *attrs* instead!


## Workflow

First off, thank you for considering to contribute!
It's people like *you* who make this project such a great tool for everyone.

- No contribution is too small!
  Please submit as many fixes for typos and grammar bloopers as you can!

- Try to limit each pull request to *one* change only.

- Since we squash on merge, it's up to you how you handle updates to the `main` branch.
  Whether you prefer to rebase on `main` or merge `main` into your branch, do whatever is more comfortable for you.

  Just remember to [not use your own `main` branch for the pull request](https://hynek.me/articles/pull-requests-branch/).

- *Always* add tests and docs for your code.
  This is a hard rule; patches with missing tests or documentation won't be merged.

- Consider adding a news fragment to [`changelog.d`](../changelog.d/) to reflect the changes as observed by people *using* this library.

- Make sure your changes pass our [CI](https://github.com/python-attrs/attrs/actions).
  You won't get any feedback until it's green unless you ask for it.

  For the CI to pass, the coverage must be 100%.
  If you have problems to test something, open anyway and ask for advice.
  In some situations, we may agree to add an `# pragma: no cover`.

- Once you've addressed review feedback, make sure to bump the pull request with a short note, so we know you're done.

- Don't break [backwards-compatibility](SECURITY.md).


## Local Development Environment

First, **fork** the repository on GitHub and **clone** it using one of the alternatives that you can copy-paste by pressing the big green button labeled `<> Code`.

You can (and should) run our test suite using [*tox*](https://tox.wiki/).
However, you'll probably want a more traditional environment as well.

We recommend using the Python version from the `.python-version-default` file in the project's root directory, because that's the one that is used in the CI by default, too.

If you're using [*direnv*](https://direnv.net), you can automate the creation of the project virtual environment with the correct Python version by adding the following `.envrc` to the project root:

```bash
layout python python$(cat .python-version-default)
```

or, if you like [*uv*](https://github.com/astral-sh/uv):

```bash
test -d .venv || uv venv --python python$(cat .python-version-default)
. .venv/bin/activate
```

> [!WARNING]
> - **Before** you start working on a new pull request, use the "*Sync fork*" button in GitHub's web UI to ensure your fork is up to date.
>
> - **Always create a new branch off `main` for each new pull request.**
>   Yes, you can work on `main` in your fork and submit pull requests.
>   But this will *inevitably* lead to you not being able to synchronize your fork with upstream and having to start over.

Change into the newly created directory and after activating a virtual environment, install an editable version of this project along with its tests requirements:

```console
$ pip install -e .[dev]  # or `uv pip install -e .[dev]`
```

Now you can run the test suite:

```console
$ python -Im pytest
```

You can *significantly* speed up the test suite by passing `-n auto` to *pytest* which activates [*pytest-xdist*](https://github.com/pytest-dev/pytest-xdist) and takes advantage of all your CPU cores.

---

When working on the documentation, use:

```console
$ tox run -e docs-watch
```

This will build the documentation, watch for changes, and rebuild it whenever you save a file.

To just build the documentation and exit immediately use:

```console
$ tox run -e docs-build
```

You will find the built documentation in `docs/_build/html`.

To run doctests:

```console
$ tox run -e docs-doctests
```


## Code

- We follow [PEP 8](https://peps.python.org/pep-0008/) as enforced by [Ruff](https://ruff.rs/) with a line length of 79 characters.

- As long as you run our full *tox* suite before committing, or install our [*pre-commit*](https://pre-commit.com/) hooks, you won't have to spend any time on formatting your code at all.
  If you don't, CI will catch it for you -- but that seems like a waste of your time!

- If you've changed or added public APIs, please update our type stubs (files ending in `.pyi`).



## Tests

- Write your asserts as `expected == actual` to line them up nicely, and leave an empty line before them:

  ```python
  x = f()

  assert 42 == x.some_attribute
  assert "foo" == x._a_private_attribute
  ```

- You can run the test suite runs with all dependencies against all supported Python versions -- just as it will in our CI -- by running `tox`.

- Write [good test docstrings](https://jml.io/test-docstrings/).

- To ensure new features work well with the rest of the system, they should be also added to our [Hypothesis](https://hypothesis.readthedocs.io/) testing strategy, which can be found in `tests/strategies.py`.


## Documentation

- Use [semantic newlines] in [reStructuredText](https://www.sphinx-doc.org/en/stable/usage/restructuredtext/basics.html) (`*.rst`) and [Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) (`*.md`) files:

  ```markdown
  This is a sentence.
  This is another sentence.

  This is a new paragraph.
  ```

- If you start a new section, add two blank lines before and one blank line after the header except if two headers follow immediately after each other:

  ```markdown
  # Main Header

  Last line of previous section.


  ## Header of New Top Section

  ### Header of New Section

  First line of new section.
  ```

- If you add a new feature, demonstrate its awesomeness on the [examples page](https://github.com/python-attrs/attrs/blob/main/docs/examples.md)!

- For docstrings, we follow [PEP 257](https://peps.python.org/pep-0257/), use the `"""`-on-separate-lines style, and [Napoleon](https://www.sphinx-doc.org/en/master/usage/extensions/napoleon.html)-style API documentation:

  ```python
  def func(x: str, y: int) -> str:
      """
      Do something.

      Args:
          x: A very important argument.

          y:
            Another very important argument, but its description is so long
            that it doesn't fit on one line. So, we start the whole block on a
            fresh new line to keep the block together.

      Returns:
          str: The result of doing something.

      Raises:
          ValueError: When an invalid value is passed.
      """
  ```

  Please note that the API docstrings are still reStructuredText.

- If you add or change public APIs, tag the docstring using `..  versionadded:: 24.1.0 WHAT` or `..  versionchanged:: 24.1.0 WHAT`.
  We follow CalVer, so the next version will be the current with with the middle number incremented (for example, `24.1.0` -> `24.2.0`).


### Changelog

If your change is interesting to end-users, there needs to be a changelog entry so they can learn about it!

To avoid merge conflicts, we use the [Towncrier](https://pypi.org/project/towncrier) package to manage our changelog.
*towncrier* uses independent Markdown files for each pull request -- so called *news fragments* -- instead of one monolithic changelog file.
On release, those news fragments are compiled into our [`CHANGELOG.md`](../CHANGELOG.md).

You don't need to install Towncrier yourself, you just have to abide by a few simple rules:

- For each pull request, add a new file into `changelog.d` with a filename adhering to the `pr#.(change|deprecation|breaking).md` schema:
  For example, `changelog.d/42.change.md` for a non-breaking change that is proposed in pull request #42.

- As with other docs, please use [semantic newlines] within news fragments.

- Refer to all symbols by their fully-qualified names.
  For example, `attrs.Foo` -- not just `Foo`.

- Wrap symbols like modules, functions, or classes into backticks, so they are rendered in a `monospace font`.

- Wrap arguments into asterisks so they are *italicized* like in API documentation:
  `Added new argument *an_argument*.`

- If you mention functions or methods, add parentheses at the end of their names:
  `attrs.func()` or `attrs.Class.method()`.
  This makes the changelog a lot more readable.

- Prefer simple past tense or constructions with "now".

Example entries:

  ```md
  Added `attrs.validators.func()`.
  The feature really *is* awesome.
  ```

or:

  ```md
  `attrs.func()` now doesn't crash the Large Hadron Collider anymore when passed the *foobar* argument.
  The bug really *was* nasty.
  ```

---

If you want to reference multiple issues, copy the news fragment to another filename.
Towncrier will merge all news fragments with identical contents into one entry with multiple links to the respective pull requests.


`tox run -e changelog` will render the current changelog to the terminal if you have any doubts.


## Governance

*attrs* is maintained by [team of volunteers](https://github.com/python-attrs) that is always open to new members that share our vision of a fast, lean, and magic-free library that empowers programmers to write better code with less effort.
If you'd like to join, just get a pull request merged and ask to be added in the very same pull request!

**The simple rule is that everyone is welcome to review/merge pull requests of others but nobody is allowed to merge their own code.**

[Hynek Schlawack](https://hynek.me/about/) acts reluctantly as the [BDFL](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life) and has the final say over design decisions.


## See You on GitHub!

Again, this whole file is mainly to help you to get started by codifying tribal knowledge and expectations to save you time and turnarounds.
It is **not** meant to be a barrier to entry, so don't be afraid to open half-finished PRs and ask questions if something is unclear!

Please note that this project is released with a Contributor [Code of Conduct](CODE_OF_CONDUCT.md).
By participating in this project you agree to abide by its terms.
Please report any harm to Hynek Schlawack in any way you find appropriate.

[semantic newlines]: https://rhodesmill.org/brandon/2012/one-sentence-per-line/
