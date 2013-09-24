run(function() {
  geo.getCurrentPosition(dummyFunction, null, {enableHighAccuracy: "boom"});
  geo.getCurrentPosition(dummyFunction, null, {enableHighAccuracy: 321});
  geo.getCurrentPosition(dummyFunction, null, {enableHighAccuracy: -Infinity});
  geo.getCurrentPosition(dummyFunction, null, {enableHighAccuracy: {foo: 5}});
  pass();
});
