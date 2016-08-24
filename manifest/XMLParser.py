from os.path import dirname, join

from collections import OrderedDict

from xml.parsers import expat
import xml.etree.ElementTree as etree

_catalog = join(dirname(__file__), "catalog")

def _wrap_error(e):
    err = etree.ParseError(e)
    err.code = e.code
    err.position = e.lineno, e.offset
    raise err

_names = {}
def _fixname(key):
    try:
        name = _names[key]
    except KeyError:
        name = key
        if "}" in name:
            name = "{" + name
        _names[key] = name
    return name


class XMLParser(object):
    def __init__(self):
        self._parser = expat.ParserCreate(None, "}")
        self._target = etree.TreeBuilder()
        # parser settings
        self._parser.buffer_text = 1
        self._parser.ordered_attributes = 1
        self._parser.SetParamEntityParsing(expat.XML_PARAM_ENTITY_PARSING_UNLESS_STANDALONE)
        # parser callbacks
        self._parser.StartElementHandler = self._start
        self._parser.EndElementHandler = self._end
        self._parser.CharacterDataHandler = self._data
        self._parser.ExternalEntityRefHandler = self._external
        self._parser.SkippedEntityHandler = self._skipped

    def _start(self, tag, attrib_in):
        tag = _fixname(tag)
        attrib = OrderedDict()
        if attrib_in:
            for i in range(0, len(attrib_in), 2):
                attrib[_fixname(attrib_in[i])] = attrib_in[i+1]
        return self._target.start(tag, attrib)

    def _data(self, text):
        return self._target.data(text)

    def _end(self, tag):
        return self._target.end(_fixname(tag))

    def _external(self, context, base, systemId, publicId):
        if publicId in {
                "-//W3C//DTD XHTML 1.0 Transitional//EN",
                "-//W3C//DTD XHTML 1.1//EN",
                "-//W3C//DTD XHTML 1.0 Strict//EN",
                "-//W3C//DTD XHTML 1.0 Frameset//EN",
                "-//W3C//DTD XHTML Basic 1.0//EN",
                "-//W3C//DTD XHTML 1.1 plus MathML 2.0//EN",
                "-//W3C//DTD XHTML 1.1 plus MathML 2.0 plus SVG 1.1//EN",
                "-//W3C//DTD MathML 2.0//EN",
                "-//WAPFORUM//DTD XHTML Mobile 1.0//EN"
        }:
            parser = self._parser.ExternalEntityParserCreate(context)
            with open(join(_catalog, "xhtml.dtd"), "rb") as fp:
                try:
                    parser.ParseFile(fp)
                except expat.error:
                    return False

        return True

    def _skipped(self, name, is_parameter_entity):
        err = expat.error("undefined entity %s: line %d, column %d" %
                          (name, self._parser.ErrorLineNumber,
                           self._parser.ErrorColumnNumber))
        err.code = expat.errors.XML_ERROR_UNDEFINED_ENTITY
        err.lineno = self._parser.ErrorLineNumber
        err.offset = self._parser.ErrorColumnNumber
        raise err


    def feed(self, data):
        try:
            self._parser.Parse(data, False)
        except expat.error as v:
            _wrap_error(v)

    def close(self):
        try:
            self._parser.Parse("", True)
        except expat.error as v:
            _wrap_error(v)
        tree = self._target.close()
        return tree
