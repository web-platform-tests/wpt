// META: title=CrashReportContext has set method

/*
 * The CrashReportContext interface must have a set method.
 */

test(() => {
  assert_equals(typeof CrashReportContext.prototype.set, 'function');
}, "CrashReportContext has set method");