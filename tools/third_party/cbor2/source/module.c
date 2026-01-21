#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <datetime.h>
#include "module.h"
#include "tags.h"
#include "encoder.h"
#include "decoder.h"


// Some notes on conventions in this code. All methods conform to a couple of
// return styles:
//
// * PyObject* (mostly for methods accessible from Python) in which case a
//   return value of NULL indicates an error, or
//
// * int (mostly for internal methods) in which case 0 indicates success and -1
//   an error. This is in keeping with most of Python's C-API.
//
// In an attempt to avoid leaks a particular coding style is used where
// possible:
//
// 1. As soon as a new reference to an object is generated / returned, a
//    block like this follows: if (ref) { ... Py_DECREF(ref); }
//
// 2. The result is calculated in the "ret" local and returned only at the
//    end of the function, once we're sure all references have been accounted
//    for.
//
// 3. No "return" is permitted before the end of the function, and "break" or
//    "goto" should be used over a minimal distance to ensure Py_DECREFs aren't
//    jumped over.
//
// 4. Wherever possible, functions that return a PyObject pointer return a
//    *new* reference (like the majority of the CPython API) as opposed to
//    a borrowed reference.
//
// 5. The above rules are broken occasionally where necessary for clarity :)
//
// While this style helps ensure fewer leaks, it's worth noting it results in
// rather "nested" code which looks a bit unusual / ugly for C. Furthermore,
// it's not fool-proof; there's probably some leaks left. Please file bugs for
// any leaks you detect!


// break_marker singleton ////////////////////////////////////////////////////

static PyObject *
break_marker_repr(PyObject *op)
{
    return PyUnicode_FromString("break_marker");
}

static void
break_marker_dealloc(PyObject *ignore)
{
    Py_FatalError("deallocating break_marker");
}

static PyObject *
break_marker_new(PyTypeObject *type, PyObject *args, PyObject *kwargs)
{
    if (PyTuple_GET_SIZE(args) || (kwargs && PyDict_Size(kwargs))) {
        PyErr_SetString(PyExc_TypeError, "break_marker_type takes no arguments");
        return NULL;
    }
    Py_INCREF(break_marker);
    return break_marker;
}

static int
break_marker_bool(PyObject *v)
{
    return 1;
}

static PyNumberMethods break_marker_as_number = {
    .nb_bool = (inquiry) break_marker_bool,
};

PyTypeObject break_marker_type = {
    PyVarObject_HEAD_INIT(NULL, 0)
    .tp_name = "break_marker_type",
    .tp_flags = Py_TPFLAGS_DEFAULT,
    .tp_new = break_marker_new,
    .tp_dealloc = break_marker_dealloc,
    .tp_repr = break_marker_repr,
    .tp_as_number = &break_marker_as_number,
};

PyObject _break_marker_obj = {
    _PyObject_EXTRA_INIT
    1, &break_marker_type
};


// undefined singleton ///////////////////////////////////////////////////////

static PyObject *
undefined_repr(PyObject *op)
{
    return PyUnicode_FromString("undefined");
}

static void
undefined_dealloc(PyObject *ignore)
{
    Py_FatalError("deallocating undefined");
}

static PyObject *
undefined_new(PyTypeObject *type, PyObject *args, PyObject *kwargs)
{
    if (PyTuple_GET_SIZE(args) || (kwargs && PyDict_Size(kwargs))) {
        PyErr_SetString(PyExc_TypeError, "undefined_type takes no arguments");
        return NULL;
    }
    Py_INCREF(undefined);
    return undefined;
}

static int
undefined_bool(PyObject *v)
{
    return 0;
}

static PyNumberMethods undefined_as_number = {
    .nb_bool = (inquiry) undefined_bool,
};

PyTypeObject undefined_type = {
    PyVarObject_HEAD_INIT(NULL, 0)
    .tp_name = "undefined_type",
    .tp_flags = Py_TPFLAGS_DEFAULT,
    .tp_new = undefined_new,
    .tp_dealloc = undefined_dealloc,
    .tp_repr = undefined_repr,
    .tp_as_number = &undefined_as_number,
};

PyObject _undefined_obj = {
    _PyObject_EXTRA_INIT
    1, &undefined_type
};


// CBORSimpleValue namedtuple ////////////////////////////////////////////////

PyTypeObject CBORSimpleValueType;

static PyStructSequence_Field CBORSimpleValueFields[] = {
    {.name = "value"},
    {NULL},
};

PyDoc_STRVAR(_CBOR2_CBORSimpleValue__doc__,
"Represents a CBOR \"simple value\", with a value of 0 to 255."
);

static PyStructSequence_Desc CBORSimpleValueDesc = {
    .name = "CBORSimpleValue",
    .doc = _CBOR2_CBORSimpleValue__doc__,
    .fields = CBORSimpleValueFields,
    .n_in_sequence = 1,
};

static PyObject *
CBORSimpleValue_new(PyTypeObject *type, PyObject *args, PyObject *kwargs)
{
    static char *keywords[] = {"value", NULL};
    PyObject *value = NULL, *ret;
    Py_ssize_t val;

    if (!PyArg_ParseTupleAndKeywords(args, kwargs, "n", keywords, &val))
        return NULL;

    if (val < 0 || val > 255 || (val > 23 && val < 32)) {
        PyErr_SetString(PyExc_TypeError, "simple value out of range (0..23, 32..255)");
        return NULL;
    }

    ret = PyStructSequence_New(type);
    if (ret) {
        value = PyLong_FromSsize_t(val);
        if (value)
            PyStructSequence_SET_ITEM(ret, 0, value);
    }
    return ret;
}

static PyObject *
CBORSimpleValue_richcompare(PyObject *a, PyObject *b, int op)
{
    switch (PyObject_IsInstance(b, (PyObject *) &CBORSimpleValueType)) {
        case 1:
        return PyObject_RichCompare(
            PyStructSequence_GET_ITEM(a, 0),
            PyStructSequence_GET_ITEM(b, 0),
            op);
        case -1:
        return NULL;
    }
    switch (PyObject_IsInstance(b, (PyObject *) &PyLong_Type)) {
        case 1:
        return PyObject_RichCompare(
            PyStructSequence_GET_ITEM(a, 0), b, op);
        case -1:
        return NULL;
    }
    Py_RETURN_NOTIMPLEMENTED;
}


// dump/load functions ///////////////////////////////////////////////////////

static PyObject *
CBOR2_dump(PyObject *module, PyObject *args, PyObject *kwargs)
{
    PyObject *obj = NULL, *ret = NULL;
    CBOREncoderObject *self;
    bool decref_args = false;

    if (PyTuple_GET_SIZE(args) == 0) {
        if (kwargs)
            obj = PyDict_GetItem(kwargs, _CBOR2_str_obj);
        if (!obj) {
            PyErr_SetString(PyExc_TypeError,
                    "dump missing 1 required argument: 'obj'");
            return NULL;
        }
        Py_INCREF(obj);
        if (PyDict_DelItem(kwargs, _CBOR2_str_obj) == -1) {
            Py_DECREF(obj);
            return NULL;
        }
    } else {
        obj = PyTuple_GET_ITEM(args, 0);
        args = PyTuple_GetSlice(args, 1, PyTuple_GET_SIZE(args));
        if (!args)
            return NULL;
        Py_INCREF(obj);
        decref_args = true;
    }

    self = (CBOREncoderObject *)CBOREncoder_new(&CBOREncoderType, NULL, NULL);
    if (self) {
        if (CBOREncoder_init(self, args, kwargs) == 0) {
            ret = CBOREncoder_encode(self, obj);
        }
        Py_DECREF(self);
    }
    Py_DECREF(obj);
    if (decref_args)
        Py_DECREF(args);
    return ret;
}


static PyObject *
CBOR2_dumps(PyObject *module, PyObject *args, PyObject *kwargs)
{
    PyObject *fp, *result, *new_args = NULL, *obj = NULL, *ret = NULL;
    Py_ssize_t i;

    if (!_CBOR2_BytesIO && _CBOR2_init_BytesIO() == -1)
        return NULL;

    fp = PyObject_CallFunctionObjArgs(_CBOR2_BytesIO, NULL);
    if (fp) {
        if (PyTuple_GET_SIZE(args) == 0) {
            if (kwargs)
                obj = PyDict_GetItem(kwargs, _CBOR2_str_obj);
            if (obj) {
                if (PyDict_DelItem(kwargs, _CBOR2_str_obj) == 0)
                    new_args = PyTuple_Pack(2, obj, fp);
            } else {
                PyErr_SetString(PyExc_TypeError,
                        "dumps missing required argument: 'obj'");
            }
        } else {
            obj = PyTuple_GET_ITEM(args, 0);
            new_args = PyTuple_New(PyTuple_GET_SIZE(args) + 1);
            if (new_args) {
                Py_INCREF(obj);
                Py_INCREF(fp);
                PyTuple_SET_ITEM(new_args, 0, obj);  // steals ref
                PyTuple_SET_ITEM(new_args, 1, fp);  // steals ref
                for (i = 1; i < PyTuple_GET_SIZE(args); ++i) {
                    Py_INCREF(PyTuple_GET_ITEM(args, i));
                    PyTuple_SET_ITEM(new_args, i + 1, PyTuple_GET_ITEM(args, i));
                }
            }
        }

        if (new_args) {
            result = CBOR2_dump(module, new_args, kwargs);
            if (result) {
                ret = PyObject_CallMethodObjArgs(fp, _CBOR2_str_getvalue, NULL);
                Py_DECREF(result);
            }
            Py_DECREF(new_args);
        }
        Py_DECREF(fp);
    }
    return ret;
}


static PyObject *
CBOR2_load(PyObject *module, PyObject *args, PyObject *kwargs)
{
    PyObject *ret = NULL;
    CBORDecoderObject *self;

    self = (CBORDecoderObject *)CBORDecoder_new(&CBORDecoderType, NULL, NULL);
    if (self) {
        if (CBORDecoder_init(self, args, kwargs) == 0) {
            ret = CBORDecoder_decode(self);
        }
        Py_DECREF(self);
    }
    return ret;
}


static PyObject *
CBOR2_loads(PyObject *module, PyObject *args, PyObject *kwargs)
{
    PyObject *fp, *new_args = NULL, *s = NULL, *ret = NULL;
    Py_ssize_t i;

    if (!_CBOR2_BytesIO && _CBOR2_init_BytesIO() == -1)
        return NULL;

    if (PyTuple_GET_SIZE(args) == 0) {
        if (kwargs) {
            new_args = PyTuple_New(1);
            if (new_args) {
                s = PyDict_GetItem(kwargs, _CBOR2_str_s);
                Py_INCREF(s);
                if (PyDict_DelItem(kwargs, _CBOR2_str_s) == -1) {
                    Py_DECREF(s);
                    Py_CLEAR(new_args);
                }
            }
        } else {
            PyErr_SetString(PyExc_TypeError,
                    "dump missing 1 required argument: 's'");
        }
    } else {
        new_args = PyTuple_New(PyTuple_GET_SIZE(args));
        if (new_args) {
            s = PyTuple_GET_ITEM(args, 0);
            Py_INCREF(s);
            for (i = 1; i < PyTuple_GET_SIZE(args); ++i) {
                // inc. ref because PyTuple_SET_ITEM steals a ref
                Py_INCREF(PyTuple_GET_ITEM(args, i));
                PyTuple_SET_ITEM(new_args, i, PyTuple_GET_ITEM(args, i));
            }
        }
    }

    if (new_args) {
        fp = PyObject_CallFunctionObjArgs(_CBOR2_BytesIO, s, NULL);
        if (fp) {
            PyTuple_SET_ITEM(new_args, 0, fp);
            ret = CBOR2_load(module, new_args, kwargs);
            // no need to dec. ref fp here because SET_ITEM above stole the ref
        }
        Py_DECREF(s);
        Py_DECREF(new_args);
    }
    return ret;
}


// Cache-init functions //////////////////////////////////////////////////////

int
_CBOR2_init_BytesIO(void)
{
    PyObject *io;

    // from io import BytesIO
    io = PyImport_ImportModule("io");
    if (!io)
        goto error;
    _CBOR2_BytesIO = PyObject_GetAttr(io, _CBOR2_str_BytesIO);
    Py_DECREF(io);
    if (!_CBOR2_BytesIO)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError,
            "unable to import BytesIO from io");
    return -1;
}

int
_CBOR2_init_FrozenDict(void)
{
    PyObject *cbor2_types;

    // from cbor2.types import FrozenDict
    cbor2_types = PyImport_ImportModule("cbor2._types");
    if (!cbor2_types)
        goto error;
    _CBOR2_FrozenDict = PyObject_GetAttr(cbor2_types, _CBOR2_str_FrozenDict);
    Py_DECREF(cbor2_types);
    if (!_CBOR2_FrozenDict)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError,
            "unable to import FrozenDict from cbor2._types");
    return -1;
}


int
_CBOR2_init_Decimal(void)
{
    PyObject *decimal;

    // from decimal import Decimal
    decimal = PyImport_ImportModule("decimal");
    if (!decimal)
        goto error;
    _CBOR2_Decimal = PyObject_GetAttr(decimal, _CBOR2_str_Decimal);
    Py_DECREF(decimal);
    if (!_CBOR2_Decimal)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError, "unable to import Decimal from decimal");
    return -1;
}


int
_CBOR2_init_Fraction(void)
{
    PyObject *fractions;

    // from fractions import Fraction
    fractions = PyImport_ImportModule("fractions");
    if (!fractions)
        goto error;
    _CBOR2_Fraction = PyObject_GetAttr(fractions, _CBOR2_str_Fraction);
    Py_DECREF(fractions);
    if (!_CBOR2_Fraction)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError, "unable to import Fraction from fractions");
    return -1;
}


int
_CBOR2_init_UUID(void)
{
    PyObject *uuid;

    // from uuid import UUID
    uuid = PyImport_ImportModule("uuid");
    if (!uuid)
        goto error;
    _CBOR2_UUID = PyObject_GetAttr(uuid, _CBOR2_str_UUID);
    Py_DECREF(uuid);
    if (!_CBOR2_UUID)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError, "unable to import UUID from uuid");
    return -1;
}


int
_CBOR2_init_re_compile(void)
{
    PyObject *re = NULL;

    // import re
    // datestr_re = re.compile("long-date-time-regex...")
    re = PyImport_ImportModule("re");
    if (!re)
        goto error;

    _CBOR2_re_compile = PyObject_GetAttr(re, _CBOR2_str_compile);
    if (!_CBOR2_re_compile)
        goto error;

    _CBOR2_re_error = PyObject_GetAttrString(re, "error");
    if (!_CBOR2_re_error) {
        Py_DECREF(_CBOR2_re_compile);
        _CBOR2_re_compile = NULL;
        goto error;
    }

    _CBOR2_datetimestr_re = PyObject_CallFunctionObjArgs(
            _CBOR2_re_compile, _CBOR2_str_datetimestr_re, NULL);
    if (!_CBOR2_datetimestr_re)
        goto error;

    _CBOR2_datestr_re = PyObject_CallFunctionObjArgs(
            _CBOR2_re_compile, _CBOR2_str_datestr_re, NULL);
    if (!_CBOR2_datestr_re)
        goto error;

    _CBOR2_datestr_re = PyObject_CallFunctionObjArgs(
            _CBOR2_re_compile, _CBOR2_str_datestr_re, NULL);
    if (!_CBOR2_datestr_re)
        goto error;

    return 0;
error:
    Py_XDECREF(re);
    PyErr_SetString(PyExc_ImportError, "unable to import compile from re");
    return -1;
}


int
_CBOR2_init_timezone_utc(void)
{
#if PY_VERSION_HEX >= 0x03070000
    Py_INCREF(PyDateTime_TimeZone_UTC);
    _CBOR2_timezone_utc = PyDateTime_TimeZone_UTC;
    _CBOR2_timezone = NULL;
    return 0;
#else
    PyObject* datetime;

    // from datetime import timezone
    // utc = timezone.utc
    datetime = PyImport_ImportModule("datetime");
    if (!datetime)
        goto error;
    _CBOR2_timezone = PyObject_GetAttr(datetime, _CBOR2_str_timezone);
    Py_DECREF(datetime);
    if (!_CBOR2_timezone)
        goto error;
    _CBOR2_timezone_utc = PyObject_GetAttr(_CBOR2_timezone, _CBOR2_str_utc);
    if (!_CBOR2_timezone_utc)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError, "unable to import timezone from datetime");
    return -1;
#endif
}


int
_CBOR2_init_Parser(void)
{
    PyObject *parser;

    // from email.parser import Parser
    parser = PyImport_ImportModule("email.parser");
    if (!parser)
        goto error;
    _CBOR2_Parser = PyObject_GetAttr(parser, _CBOR2_str_Parser);
    Py_DECREF(parser);
    if (!_CBOR2_Parser)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError, "unable to import Parser from email.parser");
    return -1;
}


int
_CBOR2_init_ip_address(void)
{
    PyObject *ipaddress;

    // from ipaddress import ip_address
    ipaddress = PyImport_ImportModule("ipaddress");
    if (!ipaddress)
        goto error;
    _CBOR2_ip_address = PyObject_GetAttr(ipaddress, _CBOR2_str_ip_address);
    _CBOR2_ip_network = PyObject_GetAttr(ipaddress, _CBOR2_str_ip_network);
    Py_DECREF(ipaddress);
    if (!_CBOR2_ip_address)
        goto error;
    if (!_CBOR2_ip_network)
        goto error;
    return 0;
error:
    PyErr_SetString(PyExc_ImportError, "unable to import ip_address from ipaddress");
    return -1;
}


int
_CBOR2_init_thread_locals(void)
{
    PyObject *threading = PyImport_ImportModule("threading");
    if (!threading)
        return -1;

    PyObject *local = PyObject_GetAttrString(threading, "local");
    Py_DECREF(threading);
    if (!local)
        return -1;

    _CBOR2_thread_locals = PyObject_CallObject(local, NULL);
    Py_DECREF(local);
    if (!_CBOR2_thread_locals)
        return -1;

    return 0;
}


// Module definition /////////////////////////////////////////////////////////

PyObject *_CBOR2_empty_bytes = NULL;
PyObject *_CBOR2_empty_str = NULL;
PyObject *_CBOR2_date_ordinal_offset = NULL;
PyObject *_CBOR2_str_as_string = NULL;
PyObject *_CBOR2_str_as_tuple = NULL;
PyObject *_CBOR2_str_bit_length = NULL;
PyObject *_CBOR2_str_bytes = NULL;
PyObject *_CBOR2_str_BytesIO = NULL;
PyObject *_CBOR2_str_canonical_encoders = NULL;
PyObject *_CBOR2_str_compile = NULL;
PyObject *_CBOR2_str_copy = NULL;
PyObject *_CBOR2_str_datetimestr_re = NULL;
PyObject *_CBOR2_str_datestr_re = NULL;
PyObject *_CBOR2_str_Decimal = NULL;
PyObject *_CBOR2_str_default_encoders = NULL;
PyObject *_CBOR2_str_denominator = NULL;
PyObject *_CBOR2_str_encode_date = NULL;
PyObject *_CBOR2_str_Fraction = NULL;
PyObject *_CBOR2_str_fromtimestamp = NULL;
PyObject *_CBOR2_str_FrozenDict = NULL;
PyObject *_CBOR2_str_fromordinal = NULL;
PyObject *_CBOR2_str_getvalue = NULL;
PyObject *_CBOR2_str_groups = NULL;
PyObject *_CBOR2_str_ip_address = NULL;
PyObject *_CBOR2_str_ip_network = NULL;
PyObject *_CBOR2_str_is_infinite = NULL;
PyObject *_CBOR2_str_is_nan = NULL;
PyObject *_CBOR2_str_isoformat = NULL;
PyObject *_CBOR2_str_join = NULL;
PyObject *_CBOR2_str_match = NULL;
PyObject *_CBOR2_str_network_address = NULL;
PyObject *_CBOR2_str_numerator = NULL;
PyObject *_CBOR2_str_obj = NULL;
PyObject *_CBOR2_str_packed = NULL;
PyObject *_CBOR2_str_Parser = NULL;
PyObject *_CBOR2_str_parsestr = NULL;
PyObject *_CBOR2_str_pattern = NULL;
PyObject *_CBOR2_str_prefixlen = NULL;
PyObject *_CBOR2_str_read = NULL;
PyObject *_CBOR2_str_s = NULL;
PyObject *_CBOR2_str_timestamp = NULL;
PyObject *_CBOR2_str_toordinal = NULL;
PyObject *_CBOR2_str_timezone = NULL;
PyObject *_CBOR2_str_update = NULL;
PyObject *_CBOR2_str_utc = NULL;
PyObject *_CBOR2_str_utc_suffix = NULL;
PyObject *_CBOR2_str_UUID = NULL;
PyObject *_CBOR2_str_write = NULL;

PyObject *_CBOR2_CBORError = NULL;
PyObject *_CBOR2_CBOREncodeError = NULL;
PyObject *_CBOR2_CBOREncodeTypeError = NULL;
PyObject *_CBOR2_CBOREncodeValueError = NULL;
PyObject *_CBOR2_CBORDecodeError = NULL;
PyObject *_CBOR2_CBORDecodeValueError = NULL;
PyObject *_CBOR2_CBORDecodeEOF = NULL;

PyObject *_CBOR2_timezone = NULL;
PyObject *_CBOR2_timezone_utc = NULL;
PyObject *_CBOR2_BytesIO = NULL;
PyObject *_CBOR2_Decimal = NULL;
PyObject *_CBOR2_Fraction = NULL;
PyObject *_CBOR2_FrozenDict = NULL;
PyObject *_CBOR2_UUID = NULL;
PyObject *_CBOR2_Parser = NULL;
PyObject *_CBOR2_re_compile = NULL;
PyObject *_CBOR2_re_error = NULL;
PyObject *_CBOR2_datetimestr_re = NULL;
PyObject *_CBOR2_datestr_re = NULL;
PyObject *_CBOR2_ip_address = NULL;
PyObject *_CBOR2_ip_network = NULL;
PyObject *_CBOR2_thread_locals = NULL;

PyObject *_CBOR2_default_encoders = NULL;
PyObject *_CBOR2_canonical_encoders = NULL;

static void
cbor2_free(PyObject *m)
{
    Py_CLEAR(_CBOR2_timezone_utc);
    Py_CLEAR(_CBOR2_timezone);
    Py_CLEAR(_CBOR2_BytesIO);
    Py_CLEAR(_CBOR2_Decimal);
    Py_CLEAR(_CBOR2_Fraction);
    Py_CLEAR(_CBOR2_UUID);
    Py_CLEAR(_CBOR2_Parser);
    Py_CLEAR(_CBOR2_re_compile);
    Py_CLEAR(_CBOR2_datetimestr_re);
    Py_CLEAR(_CBOR2_datestr_re);
    Py_CLEAR(_CBOR2_ip_address);
    Py_CLEAR(_CBOR2_ip_network);
    Py_CLEAR(_CBOR2_thread_locals);
    Py_CLEAR(_CBOR2_CBOREncodeError);
    Py_CLEAR(_CBOR2_CBOREncodeTypeError);
    Py_CLEAR(_CBOR2_CBOREncodeValueError);
    Py_CLEAR(_CBOR2_CBORDecodeError);
    Py_CLEAR(_CBOR2_CBORDecodeValueError);
    Py_CLEAR(_CBOR2_CBORDecodeEOF);
    Py_CLEAR(_CBOR2_CBORError);
    Py_CLEAR(_CBOR2_default_encoders);
    Py_CLEAR(_CBOR2_canonical_encoders);
}

static PyMethodDef _cbor2methods[] = {
    {"dump", (PyCFunction) CBOR2_dump, METH_VARARGS | METH_KEYWORDS,
        "encode a value to the stream"},
    {"dumps", (PyCFunction) CBOR2_dumps, METH_VARARGS | METH_KEYWORDS,
        "encode a value to a byte-string"},
    {"load", (PyCFunction) CBOR2_load, METH_VARARGS | METH_KEYWORDS,
        "decode a value from the stream"},
    {"loads", (PyCFunction) CBOR2_loads, METH_VARARGS | METH_KEYWORDS,
        "decode a value from a byte-string"},
    {NULL}
};

PyDoc_STRVAR(_cbor2__doc__,
"The _cbor2 module is the C-extension backing the cbor2 Python module. It\n"
"defines the base :exc:`CBORError`, :exc:`CBOREncodeError`,\n"
":exc:`CBOREncodeTypeError`, :exc:`CBOREncodeValueError`,\n"
":exc:`CBORDecodeError`, :exc:`CBORDecodeValueError`, :exc:`CBORDecodeEOF`,\n"
":class:`CBOREncoder`, :class:`CBORDecoder`, :class:`CBORTag`, and undefined\n"
"types which are operational in and of themselves."
);

PyDoc_STRVAR(_cbor2_CBORError__doc__,
"Base class for errors that occur during CBOR encoding or decoding."
);

PyDoc_STRVAR(_cbor2_CBOREncodeError__doc__,
"Raised for exceptions occurring during CBOR encoding."
);

PyDoc_STRVAR(_cbor2_CBOREncodeTypeError__doc__,
"Raised when attempting to encode a type that cannot be serialized."
);

PyDoc_STRVAR(_cbor2_CBOREncodeValueError__doc__,
"Raised when the CBOR encoder encounters an invalid value."
);

PyDoc_STRVAR(_cbor2_CBORDecodeError__doc__,
"Raised for exceptions occurring during CBOR decoding."
);

PyDoc_STRVAR(_cbor2_CBORDecodeValueError__doc__,
"Raised when the CBOR stream being decoded contains an invalid value."
);

PyDoc_STRVAR(_cbor2_CBORDecodeEOF__doc__,
"Raised when decoding unexpectedly reaches EOF."
);

static struct PyModuleDef _cbor2module = {
    PyModuleDef_HEAD_INIT,
    .m_name = "_cbor2",
    .m_doc = _cbor2__doc__,
    .m_size = -1,
    .m_free = (freefunc) cbor2_free,
    .m_methods = _cbor2methods,
};

int
init_default_encoders(void)
{
    PyObject *mod, *dict;

    // NOTE: All functions below return borrowed references, hence the lack of
    // DECREF calls
    if (_CBOR2_default_encoders)
        return 0;
    mod = PyState_FindModule(&_cbor2module);
    if (!mod)
        return -1;
    dict = PyModule_GetDict(mod);
    if (!dict)
        return -1;
    _CBOR2_default_encoders = PyDict_GetItem(
        dict, _CBOR2_str_default_encoders);
    if (_CBOR2_default_encoders) {
        Py_INCREF(_CBOR2_default_encoders);
        return 0;
    }
    return -1;
}

int
init_canonical_encoders(void)
{
    PyObject *mod, *dict;

    // NOTE: All functions below return borrowed references, hence the lack of
    // DECREF calls
    if (_CBOR2_canonical_encoders)
        return 0;
    mod = PyState_FindModule(&_cbor2module);
    if (!mod)
        return -1;
    dict = PyModule_GetDict(mod);
    if (!dict)
        return -1;
    _CBOR2_canonical_encoders = PyDict_GetItem(
        dict, _CBOR2_str_canonical_encoders);
    if (_CBOR2_canonical_encoders) {
        Py_INCREF(_CBOR2_canonical_encoders);
        return 0;
    }
    return -1;
}

PyMODINIT_FUNC
PyInit__cbor2(void)
{
    PyObject *module, *base;

    PyDateTime_IMPORT;
    if (!PyDateTimeAPI)
        return NULL;

    if (PyType_Ready(&break_marker_type) < 0)
        return NULL;
    if (PyType_Ready(&undefined_type) < 0)
        return NULL;
    if (PyType_Ready(&CBORTagType) < 0)
        return NULL;
    if (PyType_Ready(&CBOREncoderType) < 0)
        return NULL;
    if (PyType_Ready(&CBORDecoderType) < 0)
        return NULL;

    module = PyModule_Create(&_cbor2module);
    if (!module)
        return NULL;

    _CBOR2_CBORError = PyErr_NewExceptionWithDoc(
            "_cbor2.CBORError", _cbor2_CBORError__doc__, NULL, NULL);
    if (!_CBOR2_CBORError)
        goto error;
    Py_INCREF(_CBOR2_CBORError);
    if (PyModule_AddObject(module, "CBORError", _CBOR2_CBORError) == -1)
        goto error;

    _CBOR2_CBOREncodeError = PyErr_NewExceptionWithDoc(
            "_cbor2.CBOREncodeError", _cbor2_CBOREncodeError__doc__,
            _CBOR2_CBORError, NULL);
    if (!_CBOR2_CBOREncodeError)
        goto error;
    Py_INCREF(_CBOR2_CBOREncodeError);
    if (PyModule_AddObject(module, "CBOREncodeError", _CBOR2_CBOREncodeError) == -1)
        goto error;

    base = PyTuple_Pack(2, _CBOR2_CBOREncodeError, PyExc_TypeError);
    _CBOR2_CBOREncodeTypeError = PyErr_NewExceptionWithDoc(
            "_cbor2.CBOREncodeTypeError", _cbor2_CBOREncodeTypeError__doc__,
            base, NULL);
    Py_DECREF(base);
    if (!_CBOR2_CBOREncodeTypeError)
        goto error;
    Py_INCREF(_CBOR2_CBOREncodeTypeError);
    if (PyModule_AddObject(module, "CBOREncodeTypeError", _CBOR2_CBOREncodeTypeError) == -1)
        goto error;

    base = PyTuple_Pack(2, _CBOR2_CBOREncodeError, PyExc_ValueError);
    _CBOR2_CBOREncodeValueError = PyErr_NewExceptionWithDoc(
            "_cbor2.CBOREncodeValueError", _cbor2_CBOREncodeValueError__doc__,
            base, NULL);
    Py_DECREF(base);
    if (!_CBOR2_CBOREncodeValueError)
        goto error;
    Py_INCREF(_CBOR2_CBOREncodeValueError);
    if (PyModule_AddObject(module, "CBOREncodeValueError", _CBOR2_CBOREncodeValueError) == -1)
        goto error;

    _CBOR2_CBORDecodeError = PyErr_NewExceptionWithDoc(
            "_cbor2.CBORDecodeError", _cbor2_CBORDecodeError__doc__,
            _CBOR2_CBORError, NULL);
    if (!_CBOR2_CBORDecodeError)
        goto error;
    Py_INCREF(_CBOR2_CBORDecodeError);
    if (PyModule_AddObject(module, "CBORDecodeError", _CBOR2_CBORDecodeError) == -1)
        goto error;

    base = PyTuple_Pack(2, _CBOR2_CBORDecodeError, PyExc_ValueError);
    _CBOR2_CBORDecodeValueError = PyErr_NewExceptionWithDoc(
            "_cbor2.CBORDecodeValueError", _cbor2_CBORDecodeValueError__doc__,
            base, NULL);
    Py_DECREF(base);
    if (!_CBOR2_CBORDecodeValueError)
        goto error;
    Py_INCREF(_CBOR2_CBORDecodeValueError);
    if (PyModule_AddObject(module, "CBORDecodeValueError", _CBOR2_CBORDecodeValueError) == -1)
        goto error;

    base = PyTuple_Pack(2, _CBOR2_CBORDecodeError, PyExc_EOFError);
    _CBOR2_CBORDecodeEOF = PyErr_NewExceptionWithDoc(
            "_cbor2.CBORDecodeEOF", _cbor2_CBORDecodeEOF__doc__,
            base, NULL);
    Py_DECREF(base);
    if (!_CBOR2_CBORDecodeEOF)
        goto error;
    Py_INCREF(_CBOR2_CBORDecodeEOF);
    if (PyModule_AddObject(module, "CBORDecodeEOF", _CBOR2_CBORDecodeEOF) == -1)
        goto error;

    // Use PyStructSequence_InitType2 to workaround #34784 (dup of #28709)
    if (PyStructSequence_InitType2(&CBORSimpleValueType, &CBORSimpleValueDesc) == -1)
        goto error;

    Py_INCREF((PyObject *) &CBORSimpleValueType);
    CBORSimpleValueType.tp_new = CBORSimpleValue_new;
    CBORSimpleValueType.tp_richcompare = CBORSimpleValue_richcompare;
    if (PyModule_AddObject(
            module, "CBORSimpleValue", (PyObject *) &CBORSimpleValueType) == -1)
        goto error;

    Py_INCREF(&CBORTagType);
    if (PyModule_AddObject(module, "CBORTag", (PyObject *) &CBORTagType) == -1)
        goto error;

    Py_INCREF(&CBOREncoderType);
    if (PyModule_AddObject(module, "CBOREncoder", (PyObject *) &CBOREncoderType) == -1)
        goto error;

    Py_INCREF(&CBORDecoderType);
    if (PyModule_AddObject(module, "CBORDecoder", (PyObject *) &CBORDecoderType) == -1)
        goto error;

    Py_INCREF(break_marker);
    if (PyModule_AddObject(module, "break_marker", break_marker) == -1)
        goto error;

    Py_INCREF(undefined);
    if (PyModule_AddObject(module, "undefined", undefined) == -1)
        goto error;

#define INTERN_STRING(name)                                           \
    if (!_CBOR2_str_##name &&                                         \
            !(_CBOR2_str_##name = PyUnicode_InternFromString(#name))) \
        goto error;

    INTERN_STRING(as_string);
    INTERN_STRING(as_tuple);
    INTERN_STRING(bit_length);
    INTERN_STRING(bytes);
    INTERN_STRING(BytesIO);
    INTERN_STRING(canonical_encoders);
    INTERN_STRING(compile);
    INTERN_STRING(copy);
    INTERN_STRING(Decimal);
    INTERN_STRING(default_encoders);
    INTERN_STRING(denominator);
    INTERN_STRING(encode_date);
    INTERN_STRING(Fraction);
    INTERN_STRING(fromtimestamp);
    INTERN_STRING(FrozenDict);
    INTERN_STRING(fromordinal);
    INTERN_STRING(getvalue);
    INTERN_STRING(groups);
    INTERN_STRING(ip_address);
    INTERN_STRING(ip_network);
    INTERN_STRING(is_infinite);
    INTERN_STRING(is_nan);
    INTERN_STRING(isoformat);
    INTERN_STRING(join);
    INTERN_STRING(match);
    INTERN_STRING(network_address);
    INTERN_STRING(numerator);
    INTERN_STRING(obj);
    INTERN_STRING(packed);
    INTERN_STRING(Parser);
    INTERN_STRING(parsestr);
    INTERN_STRING(pattern);
    INTERN_STRING(prefixlen);
    INTERN_STRING(read);
    INTERN_STRING(s);
    INTERN_STRING(timestamp);
    INTERN_STRING(toordinal);
    INTERN_STRING(timezone);
    INTERN_STRING(update);
    INTERN_STRING(utc);
    INTERN_STRING(UUID);
    INTERN_STRING(write);

#undef INTERN_STRING

    if (!_CBOR2_date_ordinal_offset &&
            !(_CBOR2_date_ordinal_offset = PyLong_FromLong(719163)))
        goto error;
    if (!_CBOR2_str_utc_suffix &&
            !(_CBOR2_str_utc_suffix = PyUnicode_InternFromString("+00:00")))
        goto error;
    if (!_CBOR2_str_datetimestr_re &&
        !(_CBOR2_str_datetimestr_re = PyUnicode_InternFromString(
                    "^(\\d{4})-(\\d\\d)-(\\d\\d)T"     // Y-m-d
                    "(\\d\\d):(\\d\\d):(\\d\\d)"       // H:M:S
                    "(?:\\.(\\d{1,6})\\d*)?"           // .uS
                    "(?:Z|([+-]\\d\\d):(\\d\\d))$")))  // +-TZ
        goto error;
    if (!_CBOR2_str_datestr_re &&
        !(_CBOR2_str_datestr_re = PyUnicode_InternFromString("^(\\d{4})-(\\d\\d)-(\\d\\d)")))  // Y-m-d
        goto error;
    if (!_CBOR2_empty_bytes &&
            !(_CBOR2_empty_bytes = PyBytes_FromStringAndSize(NULL, 0)))
        goto error;
    if (!_CBOR2_empty_str &&
            !(_CBOR2_empty_str = PyUnicode_FromStringAndSize(NULL, 0)))
        goto error;

    return module;
error:
    Py_DECREF(module);
    return NULL;
}
