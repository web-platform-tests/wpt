https://www.w3.org/TR/CSS2/visudet.html#line-height
test(() => {
  let p = document.createElement('p');
  p.innerText = 'Some content';
  p.style.lineHeight = 'normal';
  p.style.fontFamily = 'sans-serif';
  document.body.appendChild(p);

  let computed = document
    .defaultView
    .getComputedStyle(p, null)
    .getPropertyValue("line-height");
  assert_equals(computed, 'normal', 'line-height: \'normal\' computed');
}, 'Computed line-height: normal');
