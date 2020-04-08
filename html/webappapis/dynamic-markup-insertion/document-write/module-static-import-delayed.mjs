window.parent.document.test.step_timeout(() => {
  document.write("PASS\n")
  document.close();
  window.parent.document.dispatchEvent(new CustomEvent("testEnd"));
}, 0);
