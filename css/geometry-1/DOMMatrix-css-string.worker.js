// https://drafts.fxtf.org/geometry/#DOMMatrix

importScripts("/resources/testharness.js");

['DOMMatrix', 'DOMMatrixReadOnly'].forEach(constr => {
  test(() => {
    assert_true(constr in self, `${constr} should exist`);
    assert_throws(new TypeError(), () => new self[constr]('matrix(1,0,0,1,0,0)') );
  }, `${constr} constructor with string argument in worker`);
});

test(() => {
  assert_false('setMatrixValue' in DOMMatrix.prototype, 'on prototype');
  const matrix = new DOMMatrix();
  assert_false('setMatrixValue' in matrix, 'on instance');
}, 'DOMMatrix setMatrixValue in worker');

done();
