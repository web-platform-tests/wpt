from cgi import escape
import logging
import re
import time
import types


logger = logging.getLogger("wptserve")


def resolve_content(response):
    rv = "".join(item for item in response.iter_content())
    if type(rv) == unicode:
        rv = rv.encode(response.encoding)
    return rv


class Pipeline(object):
    pipes = {}

    def __init__(self, pipe_string):
        self.pipe_functions = self.parse(pipe_string)

    def parse(self, pipe_string):
        functions = []
        for item in PipeTokenizer().tokenize(pipe_string):
            if not item:
                break
            if item[0] == "function":
                functions.append((self.pipes[item[1]], []))
            elif item[0] == "argument":
                functions[-1][1].append(item[1])
        return functions

    def __call__(self, request, response):
        for func, args in self.pipe_functions:
            response = func(request, response, *args)
        return response


class PipeTokenizer(object):
    def __init__(self):
        #This whole class can likely be replaced by some regexps
        self.state = None

    def tokenize(self, string):
        self.string = string
        self.state = self.func_name_state
        self._index = 0
        while self.state:
            yield self.state()
        yield None

    def get_char(self):
        if self._index >= len(self.string):
            return None
        rv = self.string[self._index]
        self._index += 1
        return rv

    def func_name_state(self):
        rv = ""
        while True:
            char = self.get_char()
            if char is None:
                self.state = None
                if rv:
                    return ("function", rv)
                else:
                    return None
            elif char == "(":
                self.state = self.argument_state
                return ("function", rv)
            elif char == "|":
                if rv:
                    return ("function", rv)
            else:
                rv += char

    def argument_state(self):
        rv = ""
        while True:
            char = self.get_char()
            if char is None:
                self.state = None
                return ("argument", rv)
            elif char == "\\":
                rv += self.get_escape()
                if rv is None:
                    #This should perhaps be an error instead
                    return ("argument", rv)
            elif char == ",":
                return ("argument", rv)
            elif char == ")":
                self.state = self.func_name_state
                return ("argument", rv)
            else:
                rv += char

    def get_escape(self):
        char = self.get_char()
        escapes = {"n": "\n",
                   "r": "\r",
                   "t": "\t"}
        return escapes.get(char, char)


class pipe(object):
    def __init__(self, *arg_converters):
        self.arg_converters = arg_converters
        self.max_args = len(self.arg_converters)
        self.min_args = 0
        opt_seen = False
        for item in self.arg_converters:
            if not opt_seen:
                if isinstance(item, opt):
                    opt_seen = True
                else:
                    self.min_args += 1
            else:
                if not isinstance(item, opt):
                    raise ValueError("Non-optional argument cannot follow optional argument")

    def __call__(self, f):
        def inner(request, response, *args):
            if not (self.min_args <= len(args) <= self.max_args):
                raise ValueError("Expected between %d and %d args, got %d" %
                                 (self.min_args, self.max_args, len(args)))
            arg_values = tuple(f(x) for f, x in zip(self.arg_converters, args))
            return f(request, response, *arg_values)
        Pipeline.pipes[f.__name__] = inner
        #We actually want the undecorated function in the main namespace
        return f


class opt(object):
    def __init__(self, f):
        self.f = f

    def __call__(self, arg):
        return self.f(arg)


def nullable(func):
    def inner(arg):
        if arg.lower() == "null":
            return None
        else:
            return func(arg)
    return inner


def boolean(arg):
    if arg.lower() in ("true", "1"):
        return True
    elif arg.lower() in ("false", "0"):
        return False
    raise ValueError


@pipe(int)
def status(request, response, code):
    """Alter the status code.

    :param code: Status code to use for the response."""
    response.status = code
    return response


@pipe(str, str, opt(boolean))
def header(request, response, name, value, append=False):
    """Set a HTTP header.

    Replaces any existing HTTP header of the same name unless
    append is set, in which case the header is appended without
    replacement.

    :param name: Name of the header to set.
    :param value: Value to use for the header.
    :param append: True if existing headers should not be replaced
    """
    if not append:
        response.headers.set(name, value)
    else:
        response.headers.append(name, value)
    return response


@pipe(str)
def trickle(request, response, delays):
    """Send the response in parts, with time delays.

    :param delays: A string of delays and amounts, in bytes, of the
                   response to send. Each component is separated by
                   a colon. Amounts in bytes are plain integers, whilst
                   delays are floats prefixed with a single d e.g.
                   d1:100:d2
                   Would cause a 1 second delay, would then send 100 bytes
                   of the file, and then cause a 2 second delay, before sending
                   the remainder of the file.

                   If the last token is of the form rN, instead of sending the
                   remainder of the file, the previous N instructions will be
                   repeated until the whole file has been sent e.g.
                   d1:100:d2:r2
                   Causes a delay of 1s, then 100 bytes to be sent, then a 2s delay
                   and then a further 100 bytes followed by a two second delay
                   until the response has been fully sent.
                   """
    def parse_delays():
        parts = delays.split(":")
        rv = []
        for item in parts:
            if item.startswith("d"):
                item_type = "delay"
                item = item[1:]
                value = float(item)
            elif item.startswith("r"):
                item_type = "repeat"
                value = int(item[1:])
                if not value % 2 == 0:
                    raise ValueError
            else:
                item_type = "bytes"
                value = int(item)
            if len(rv) and rv[-1][0] == item_type:
                rv[-1][1] += value
            else:
                rv.append((item_type, value))
        return rv

    delays = parse_delays()
    if not delays:
        return response
    content = resolve_content(response)
    modified_content = []
    offset = [0]

    def sleep(seconds):
        def inner():
            time.sleep(seconds)
            return ""
        return inner

    def add_content(delays, repeat=False):
        for i, (item_type, value) in enumerate(delays):
            if item_type == "bytes":
                modified_content.append(content[offset[0]:offset[0] + value])
                offset[0] += value
            elif item_type == "delay":
                modified_content.append(sleep(value))
            elif item_type == "repeat":
                assert i == len(delays) - 1
                while offset[0] < len(content):
                    add_content(delays[-(value + 1):-1], True)

        if not repeat and offset[0] < len(content):
            modified_content.append(content[offset[0]:])

    add_content(delays)

    response.content = modified_content
    return response


@pipe(nullable(int), opt(nullable(int)))
def slice(request, response, start, end=None):
    """Send a byte range of the response body

    :param start: The starting offset. Follows python semantics including
                  negative numbers.

    :param end: The ending offset, again with python semantics and None
                (spelled "null" in a query string) to indicate the end of
                the file.
    """
    content = resolve_content(response)
    response.content = content[start:end]
    return response


class ReplacementTokenizer(object):
    def ident(scanner, token):
        return ("ident", token)

    def index(scanner, token):
        token = token[1:-1]
        try:
            token = int(token)
        except:
            token = unicode(token)
        return ("index", token)

    def tokenize(self, string):
        return self.scanner.scan(string)[0]

    scanner = re.Scanner([(r"\w+", ident),
                          (r"\[[^\]]*\]", index)])


class FirstWrapper(object):
    def __init__(self, params):
        self.params = params

    def __getitem__(self, key):
        return self.params.first(key)


@pipe()
def sub(request, response):
    """Substitute environment information about the server and request into the script.

    The format is a very limited template language. Substitutions are
    enclosed by {{ and }}. There are 5 fields "host", "domains",
    "ports", "headers" and "GET":

    host
      A simple string value and represents the primary host from which the
      tests are being run.
    domains
      A dictionary of available domains indexed by subdomain name.
    ports
      A dictionary of lists of ports indexed by protocol.
    headers
      A dictionary of HTTP headers in the request.
    GET
      A dictionary of query parameters supplied with the request.

    So for example in a setup running on localhost with a www
    subdomain and a http server on ports 80 and 81::

      {{host}} => localhost
      {{domains[www]}} => www.localhost
      {{ports[http][1]}} => 81
    """
    #TODO: There basically isn't any error handling here
    content = resolve_content(response)
    tokenizer = ReplacementTokenizer()

    def config_replacement(match):
        content, = match.groups()

        tokens = tokenizer.tokenize(content)

        assert tokens[0][0] == "ident" and all(item[0] == "index" for item in tokens[1:]), tokens

        field = tokens[0][1]

        if field == "headers":
            value = request.headers
        elif field == "GET":
            value = FirstWrapper(request.GET)
        elif field in request.server.config:
            value = request.server.config[tokens[0][1]]
        else:
            raise Exception("Invalid field")

        for item in tokens[1:]:
            value = value[item[1]]

        assert isinstance(value, (int,) + types.StringTypes), tokens

        #Should possibly support escaping for other contexts e.g. script
        #TODO: read the encoding of the response
        return escape(unicode(value)).encode("utf-8")

    template_regexp = re.compile(r"{{([^}]*)}}")
    new_content, count = template_regexp.subn(config_replacement, content)

    response.content = new_content
    return response
