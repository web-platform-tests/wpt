const globalThisStr = getGlobalThisStr();

let compilationSink = null;
function resetSinkName() { compilationSink = null; }

trustedTypes.createPolicy("default", { createScript: (s, _, sink) => {
  compilationSink = sink;
  return `modified '${s}'`;
}});

test(t => {
  t.add_cleanup(resetSinkName);
  assert_throws_js(EvalError, _ => eval("'42'"));
  assert_equals(compilationSink, "eval");
}, `Blocked eval in ${globalThisStr}.`);

test(t => {
  t.add_cleanup(resetSinkName);
  assert_throws_js(EvalError, _ => new Function("return;"));
  assert_equals(compilationSink, "Function");
}, `Blocked function constructor in ${globalThisStr}.`);
