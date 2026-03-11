// META: title=CrashReportContext has delete method

/*
 * The CrashReportContext interface must have a delete method.
 */

test(() => {
  assert_equals(typeof CrashReportContext.prototype.delete, 'function');
}, "CrashReportContext has delete method");