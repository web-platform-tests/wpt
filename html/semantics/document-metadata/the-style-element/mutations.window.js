test(() => {
  const style = document.body.appendChild(document.createElement("style")),
        styleS = style.sheet;
  assert_not_equals(styleS, null);
  style.appendChild(new Comment());
  assert_equals(styleS, style.sheet);
}, "Mutating the style element: inserting a Comment node");
