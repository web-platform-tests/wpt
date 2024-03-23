'use strict';

promise_test(async testCase => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const context = await iframe.contentWindow.navigator.ml.createContext();

  // Creating an MLGraphBuilder from an MLContext of an iframe should succeed.
  const builder = new MLGraphBuilder(context);

  iframe.remove();

  // Creating a new MLGraphBuilder from an MLContext of a detached iframe should
  // fail but not crash.
  assert_equals(new MLGraphBuilder(context), undefined);
}, 'Verify creating MLGraphBuilder on detached iframe returns an error');

promise_test(async testCase => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const context = await iframe.contentWindow.navigator.ml.createContext();

  // Create a computational graph 'C = 0.2 * A + B'.
  const builder = new MLGraphBuilder(context);
  const operandDescriptor = {dataType: 'float32', dimensions: [2, 2]};

  const constant =
      builder.constant(operandDescriptor, new Float32Array(4).fill(0.2));
  const A = builder.input('A', operandDescriptor);
  const B = builder.input('B', operandDescriptor);
  const C = builder.add(builder.mul(A, constant), B);

  // Building an MLGraph from an MLGraphBuilder from an MLContext of a detached
  // iframe should fail but not crash.
  await promise_rejects_dom(
      testCase, 'InvalidStateError', builder.build({'C': C}));
}, 'Verify build() on detached iframe returns an error');

promise_test(async testCase => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const context = await iframe.contentWindow.navigator.ml.createContext();

  // Create a computational graph 'C = 0.2 * A + B'.
  const builder = new MLGraphBuilder(context);
  const operandDescriptor = {dataType: 'float32', dimensions: [2, 2]};

  const constant =
      builder.constant(operandDescriptor, new Float32Array(4).fill(0.2));
  const A = builder.input('A', operandDescriptor);
  const B = builder.input('B', operandDescriptor);
  const C = builder.add(builder.mul(A, constant), B);

  const graph = await builder.build({'C': C});

  // Bind inputs to the graph.
  const bufferA = new Float32Array(4).fill(1.0);
  const bufferB = new Float32Array(4).fill(0.8);
  const bufferC = new Float32Array(4);
  const inputs = {'A': bufferA, 'B': bufferB};
  const outputs = {'C': bufferC};

  iframe.remove();

  // Computing an MLGraph from an MLContext of a detached iframe should fail but
  // not crash.
  await promise_rejects_dom(
      testCase, 'InvalidStateError', context.compute(graph, inputs, outputs));
}, 'Verify compute() on detached iframe returns an error');
