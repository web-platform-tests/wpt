#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <stdint.h>

typedef struct {
    PyObject_HEAD
    uint64_t tag;
    PyObject *value;
} CBORTagObject;

extern PyTypeObject CBORTagType;

PyObject * CBORTag_New(uint64_t);
int CBORTag_SetValue(PyObject *, PyObject *);

#define CBORTag_CheckExact(op) (Py_TYPE(op) == &CBORTagType)
