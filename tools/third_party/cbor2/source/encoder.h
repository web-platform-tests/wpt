#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <stdint.h>
#include <stdbool.h>

// Constants for decimal_classify
#define DC_NORMAL 0
#define DC_INFINITE 1
#define DC_NAN 2
#define DC_ERROR -1

typedef struct {
    PyObject_HEAD
    PyObject *write;    // cached write() method of fp
    PyObject *encoders;
    PyObject *default_handler;
    PyObject *shared;
    PyObject *string_references;
    PyObject *tz;       // renamed from timezone to avoid Python issue #24643
    PyObject *shared_handler;
    uint8_t enc_style;  // 0=regular, 1=canonical, 2=custom
    bool timestamp_format;
    bool date_as_datetime;
    bool value_sharing;
    bool string_referencing;
    bool string_namespacing;
} CBOREncoderObject;

extern PyTypeObject CBOREncoderType;

PyObject * CBOREncoder_new(PyTypeObject *, PyObject *, PyObject *);
int CBOREncoder_init(CBOREncoderObject *, PyObject *, PyObject *);
PyObject * CBOREncoder_encode(CBOREncoderObject *, PyObject *);
