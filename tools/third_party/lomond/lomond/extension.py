from __future__ import unicode_literals


def parse_extension(extension):
    """Parse a single extension in to an extension token and a dict
    of options.

    """
    # Naive http header parser, works for current extensions
    tokens = [token.strip() for token in extension.split(';')]
    extension_token = tokens[0]
    options = {}
    for token in tokens[1:]:
        key, sep, value = token.partition('=')
        value = value.strip().strip('"')
        options[key.strip()] = value
    return extension_token, options
