// |expected| should be an object indicating the expected type of node.
function assert_node(actual, expected)
{
    assert_true(actual instanceof expected.type,
                'Node type mismatch: actual = ' + actual.nodeType + ', expected = ' + expected.nodeType);
    if (typeof(expected.id) !== 'undefined')
        assert_equals(actual.id, expected.id);
    if (typeof(expected.nodeValue) !== 'undefined')
        assert_equals(actual.nodeValue, expected.nodeValue);
}

// XXX Servo doesn't have these constants in NodeFilter yet
var FILTER_ACCEPT = 1;
var FILTER_REJECT = 2;
var FILTER_SKIP = 3;
var SHOW_ALL = 4294967295;
var SHOW_ELEMENT = 1;
var SHOW_ATTRIBUTE = 2;
var SHOW_TEXT = 4;
var SHOW_CDATA_SECTION = 8;
var SHOW_ENTITY_REFERENCE = 16;
var SHOW_ENTITY = 32;
var SHOW_PROCESSING_INSTRUCTION = 64;
var SHOW_COMMENT = 128;
var SHOW_DOCUMENT = 256;
var SHOW_DOCUMENT_TYPE = 512;
var SHOW_DOCUMENT_FRAGMENT = 1024;
var SHOW_NOTATION = 2048;
