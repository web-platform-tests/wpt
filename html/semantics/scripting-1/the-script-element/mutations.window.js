test(() => {
  const script = document.createElement("script");
  self.script2 = document.createElement("script");
  self.order = [];
  script.textContent = "order.push(1); script2.firstChild.data = 'order.push(2)'; order.push(3);";
  script2.append("");
  document.body.append(script, script2);
  assert_array_equals(order, [1, 2, 3], `Gotten order: ${order}`);
});

test(() => {
  const script = document.createElement("script");
  self.script22 = document.createElement("script");
  self.order2 = [];
  script.textContent = "order2.push(1); script22.append(new Comment()); order2.push(3);";
  script22.append("order2.push(2)");
  document.body.append(script, script22);
  assert_array_equals(order2, [1, 3, 2], `Gotten order: ${order2}`);
});
