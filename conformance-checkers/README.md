# WPT conformance-checker tests

The files in this part of the tree are not browser tests; they're documents
intended for testing the behavior of conformance checkers (e.g., validator.nu
and the W3C Nu Markup Validator).

TK: We should have here some details about the contents of the existing
subdirectories in this tree...

Note: If you're a WPT committer and you push new documents into this
`conformance-checkers` tree or push changes to existing documents in it, make
sure to then run the following `git` command:

      git subtree push -P conformance-checkers/ -b conformance-checkers \
         origin conformance-checkers

That command causes your changes to also get pushed to the
`conformance-checkers` branch of the WPT repo, and so to then also show up at
[https://github.com/w3c/web-platform-tests/tree/conformance-checkers][1]

   [1]: https://github.com/w3c/web-platform-tests/tree/conformance-checkers

