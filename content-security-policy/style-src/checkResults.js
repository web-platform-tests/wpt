onload = function() {
  test(function() {
    var text = document.getElementById("content");
    assert_true(getComputedStyle(text).marginLeft != "2px", "Inline style attribute should not be applied to text");
  });
}