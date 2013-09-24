run(function() {
  geo.watchPosition(dummyFunction, null, {enableHighAccuracy: "boom"});
  geo.watchPosition(dummyFunction, null, {enableHighAccuracy: 321});
  geo.watchPosition(dummyFunction, null, {enableHighAccuracy: -Infinity});
  geo.watchPosition(dummyFunction, null, {enableHighAccuracy: {foo: 5}});
  pass();
});
