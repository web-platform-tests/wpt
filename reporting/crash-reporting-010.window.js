// META: title=crashReport getter returns CrashReportContext instance

/*
 * When the `crashReport` getter is accessed and the associated Document is fully active,
 * it must return the relevant global object's `CrashReportContext` instance.
 */

test(() => {
  const crashReport1 = window.crashReport;
  
  assert_true(
    crashReport1 instanceof CrashReportContext,
    "window.crashReport must be an instance of CrashReportContext."
  );

  const crashReport2 = window.crashReport;
  
  assert_equals(
    crashReport1,
    crashReport2,
    "Subsequent accesses to window.crashReport must return the exact same object reference."
  );
}, "crashReport getter returns CrashReportContext instance");