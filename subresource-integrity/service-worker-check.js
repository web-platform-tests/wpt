var test = async_test("service-worker check");
test.step(function(){
  assert_unreached("Service worker loaded incorrectly with SRI");
});
