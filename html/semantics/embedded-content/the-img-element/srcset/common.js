setup({explicit_done:true});

function check(img) {
  test(function() {
    var expect = img.dataset.expect;
    if ('resolve' in img.dataset) {
      var a = document.createElement('a');
      a.href = expect;
      expect = a.href;
    }
    assert_equals(img.currentSrc, expect);
  }, format_value(img.getAttribute('srcset')) + (img.hasAttribute('sizes') ? ' sizes=' + format_value(img.getAttribute('sizes')) : ''));
}

onload = function() {
  [].forEach.call(document.images, check);
  done();
};
