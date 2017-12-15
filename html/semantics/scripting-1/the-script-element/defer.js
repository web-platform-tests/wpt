function afterLoad(){
  flag += NUMBER_SECOND;
  test(function(){
    assert_equals(flag, EXPECTED, "The value of variable is incorrect.");
  }, "script_defer_yes");
}
afterLoad();