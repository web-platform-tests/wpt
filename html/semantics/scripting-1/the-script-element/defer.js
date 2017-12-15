function afterLoad(){
  flag += NUMBER_SECOND;
  test(function(){
    assert_equals(flag, EXPECTED, "The value of variable is incorrect.");
  }, "the defer script run later");
}
afterLoad();
