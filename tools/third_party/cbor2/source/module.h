#define PY_SSIZE_T_CLEAN
#include <Python.h>

// structure of the lead-byte for all CBOR records
typedef
    union {
        struct {
#if PY_BIG_ENDIAN
            unsigned int major: 3;
            unsigned int subtype: 5;
#else
            unsigned int subtype: 5;
            unsigned int major: 3;
#endif
        };
        char byte;
    } LeadByte;

// break_marker singleton
extern PyObject _break_marker_obj;
#define break_marker (&_break_marker_obj)
#define CBOR2_RETURN_BREAK return Py_INCREF(break_marker), break_marker

// undefined singleton
extern PyObject _undefined_obj;
#define undefined (&_undefined_obj)
#define CBOR2_RETURN_UNDEFINED return Py_INCREF(undefined), undefined

// CBORSimpleValue namedtuple type
extern PyTypeObject CBORSimpleValueType;

// Various interned strings
extern PyObject *_CBOR2_empty_bytes;
extern PyObject *_CBOR2_empty_str;
extern PyObject *_CBOR2_date_ordinal_offset;
extern PyObject *_CBOR2_str_as_string;
extern PyObject *_CBOR2_str_as_tuple;
extern PyObject *_CBOR2_str_bit_length;
extern PyObject *_CBOR2_str_bytes;
extern PyObject *_CBOR2_str_BytesIO;
extern PyObject *_CBOR2_str_canonical_encoders;
extern PyObject *_CBOR2_str_compile;
extern PyObject *_CBOR2_str_copy;
extern PyObject *_CBOR2_str_datetimestr_re;
extern PyObject *_CBOR2_str_datestr_re;
extern PyObject *_CBOR2_str_Decimal;
extern PyObject *_CBOR2_str_default_encoders;
extern PyObject *_CBOR2_str_denominator;
extern PyObject *_CBOR2_str_encode_date;
extern PyObject *_CBOR2_str_Fraction;
extern PyObject *_CBOR2_str_fromtimestamp;
extern PyObject *_CBOR2_str_FrozenDict;
extern PyObject *_CBOR2_str_fromordinal;
extern PyObject *_CBOR2_str_getvalue;
extern PyObject *_CBOR2_str_groups;
extern PyObject *_CBOR2_str_ip_address;
extern PyObject *_CBOR2_str_ip_network;
extern PyObject *_CBOR2_str_is_infinite;
extern PyObject *_CBOR2_str_is_nan;
extern PyObject *_CBOR2_str_isoformat;
extern PyObject *_CBOR2_str_join;
extern PyObject *_CBOR2_str_match;
extern PyObject *_CBOR2_str_network_address;
extern PyObject *_CBOR2_str_numerator;
extern PyObject *_CBOR2_str_obj;
extern PyObject *_CBOR2_str_packed;
extern PyObject *_CBOR2_str_Parser;
extern PyObject *_CBOR2_str_parsestr;
extern PyObject *_CBOR2_str_pattern;
extern PyObject *_CBOR2_str_prefixlen;
extern PyObject *_CBOR2_str_read;
extern PyObject *_CBOR2_str_s;
extern PyObject *_CBOR2_str_timestamp;
extern PyObject *_CBOR2_str_toordinal;
extern PyObject *_CBOR2_str_timezone;
extern PyObject *_CBOR2_str_update;
extern PyObject *_CBOR2_str_utc;
extern PyObject *_CBOR2_str_utc_suffix;
extern PyObject *_CBOR2_str_UUID;
extern PyObject *_CBOR2_str_write;

// Exception classes
extern PyObject *_CBOR2_CBORError;
extern PyObject *_CBOR2_CBOREncodeError;
extern PyObject *_CBOR2_CBOREncodeTypeError;
extern PyObject *_CBOR2_CBOREncodeValueError;
extern PyObject *_CBOR2_CBORDecodeError;
extern PyObject *_CBOR2_CBORDecodeValueError;
extern PyObject *_CBOR2_CBORDecodeEOF;

// Global references (initialized by functions declared below)
extern PyObject *_CBOR2_timezone;
extern PyObject *_CBOR2_timezone_utc;
extern PyObject *_CBOR2_BytesIO;
extern PyObject *_CBOR2_Decimal;
extern PyObject *_CBOR2_Fraction;
extern PyObject *_CBOR2_FrozenDict;
extern PyObject *_CBOR2_UUID;
extern PyObject *_CBOR2_Parser;
extern PyObject *_CBOR2_re_compile;
extern PyObject *_CBOR2_re_error;
extern PyObject *_CBOR2_datetimestr_re;
extern PyObject *_CBOR2_datestr_re;
extern PyObject *_CBOR2_ip_address;
extern PyObject *_CBOR2_ip_network;
extern PyObject *_CBOR2_thread_locals;

// Initializers for the cached references above
int _CBOR2_init_timezone_utc(void); // also handles timezone
int _CBOR2_init_BytesIO(void);
int _CBOR2_init_Decimal(void);
int _CBOR2_init_Fraction(void);
int _CBOR2_init_FrozenDict(void);
int _CBOR2_init_UUID(void);
int _CBOR2_init_Parser(void);
int _CBOR2_init_re_compile(void); // also handles datetimestr_re & datestr_re & re_error
int _CBOR2_init_ip_address(void);
int _CBOR2_init_thread_locals(void);

int init_default_encoders(void);
int init_canonical_encoders(void);

// Encoder registries
extern PyObject *_CBOR2_default_encoders;
extern PyObject *_CBOR2_canonical_encoders;
