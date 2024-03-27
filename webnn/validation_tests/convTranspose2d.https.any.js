// META: title=validation tests for WebNN API convTranspose2d operation
// META: global=window,dedicatedworker
// META: script=../resources/utils_validation.js

'use strict';

// Example input in NCHW layout.
const kExampleInputDescriptor = {
  dataType: 'float32',
  dimensions: [1, 1, 5, 5]
};
// Example filter in OIHW layout.
const kExampleFilterDescriptor = {
  dataType: 'float32',
  dimensions: [1, 1, 3, 3]
};
const kExampleBiasDescriptor = {
  dataType: 'float32',
  dimensions: [/* output channels */ 1]
};

multi_builder_test(async (t, builder, otherBuilder) => {
  const inputFromOtherBuilder =
      otherBuilder.input('input', kExampleInputDescriptor);

  const filter = builder.input('filter', kExampleFilterDescriptor);
  assert_throws_js(
      TypeError, () => builder.convTranspose2d(inputFromOtherBuilder, filter));
}, '[convTranspose2d] throw if input is from another builder');

multi_builder_test(async (t, builder, otherBuilder) => {
  const filterFromOtherBuilder =
      otherBuilder.input('filter', kExampleFilterDescriptor);

  const input = builder.input('input', kExampleInputDescriptor);
  assert_throws_js(
      TypeError, () => builder.convTranspose2d(input, filterFromOtherBuilder));
}, '[convTranspose2d] throw if filter is from another builder');

multi_builder_test(async (t, builder, otherBuilder) => {
  const biasFromOtherBuilder =
      otherBuilder.input('bias', kExampleBiasDescriptor);
  const options = {inputLayout: 'nchw', bias: biasFromOtherBuilder};

  const input = builder.input('input', kExampleInputDescriptor);
  const filter = builder.input('filter', kExampleFilterDescriptor);
  assert_throws_js(
      TypeError, () => builder.convTranspose2d(input, filter, options));
}, '[convTranspose2d] throw if bias option is from another builder');

const tests = [
  {
    name: 'Test convTranspose2d with default options.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      filterLayout: 'iohw',
      inputLayout: 'nchw',
      groups: 1,
    },
    output: {dataType: 'float32', dimensions: [1, 1, 5, 5]}
  },
  {
    name:
        'Test convTranspose2d with inputLayout="nchw" and filterLayout="hwoi".',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [3, 3, 2, 1]},
    options: {
      filterLayout: 'hwoi',
      inputLayout: 'nchw',
    },
    output: {dataType: 'float32', dimensions: [1, 2, 5, 5]}
  },
  {
    name:
        'Test convTranspose2d with inputLayout="nchw" and filterLayout="ohwi".',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [2, 3, 3, 1]},
    options: {
      filterLayout: 'ohwi',
      inputLayout: 'nchw',
    },
    output: {dataType: 'float32', dimensions: [1, 2, 5, 5]}
  },
  {
    name:
        'Test convTranspose2d with inputLayout="nhwc" and filterLayout="iohw".',
    input: {dataType: 'float32', dimensions: [1, 3, 3, 1]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      filterLayout: 'iohw',
      inputLayout: 'nhwc',
    },
    output: {dataType: 'float32', dimensions: [1, 5, 5, 2]}
  },
  {
    name:
        'Test convTranspose2d with inputLayout="nhwc" and filterLayout="hwoi".',
    input: {dataType: 'float32', dimensions: [1, 3, 3, 1]},
    filter: {dataType: 'float32', dimensions: [3, 3, 2, 1]},
    options: {
      filterLayout: 'hwoi',
      inputLayout: 'nhwc',
    },
    output: {dataType: 'float32', dimensions: [1, 5, 5, 2]}
  },
  {
    name:
        'Test convTranspose2d with inputLayout="nhwc" and filterLayout="ohwi".',
    input: {dataType: 'float32', dimensions: [1, 3, 3, 1]},
    filter: {dataType: 'float32', dimensions: [2, 3, 3, 1]},
    options: {
      filterLayout: 'ohwi',
      inputLayout: 'nhwc',
    },
    output: {dataType: 'float32', dimensions: [1, 5, 5, 2]}
  },
  {
    name: 'Test convTranspose2d with strides=[3, 2], outputSizes=[10, 8].',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      strides: [3, 2],
      outputSizes: [10, 8],
    },
    output: {dataType: 'float32', dimensions: [1, 2, 10, 8]}
  },
  {
    name: 'Test convTranspose2d with strides=[3, 2], outputPadding=[1, 1].',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      strides: [3, 2],
      outputPadding: [1, 1],
    },
    output: {dataType: 'float32', dimensions: [1, 2, 10, 8]}
  },
  {
    name: 'Test convTranspose2d with padding=1.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [1, 1, 1, 1],
    },
    output: {dataType: 'float32', dimensions: [1, 1, 5, 5]}
  },
  {
    name: 'Test convTranspose2d with padding=1, groups=3.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [1, 1, 1, 1],
      groups: 3,
    },
    output: {dataType: 'float32', dimensions: [1, 3, 5, 5]}
  },
  {
    name: 'Test convTranspose2d with strides=2.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      strides: [2, 2],
    },
    output: {dataType: 'float32', dimensions: [1, 2, 7, 7]}
  },
  {
    name: 'Test convTranspose2d with strides=2 and padding=1.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [1, 1, 1, 1],
      strides: [2, 2],
    },
    output: {dataType: 'float32', dimensions: [1, 1, 5, 5]}
  },
  {
    name:
        'Test convTranspose2d with outputSizes and outputPadding. When the output sizes are explicitly specified, the output padding values are ignored.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      outputPadding: [1, 1],
      strides: [3, 2],
      outputSizes: [10, 8],
    },
    output: {dataType: 'float32', dimensions: [1, 2, 10, 8]}
  },
  {
    name:
        'Throw if the output operand \'s number of elements is too large. Set the input and filter dimensions that let the output\'s number of lements be 2 * SIZE_MAX.',
    input: {
      dataType: 'float32',
      dimensions: [1, 1, kMaxUnsignedLong / 2, kMaxUnsignedLong / 2]
    },
    filter: {dataType: 'float32', dimensions: [1, 8, 1, 1]},
  },
  {
    name: 'Throw if the input is not a 4-D tensor.',
    input: {dataType: 'float32', dimensions: [1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
  },
  {
    name: 'Throw if the filter is not a 4-D tensor.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [2, 2]},
  },
  {
    name: 'Throw if the filter data type doesn\'t match the input data type.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'int32', dimensions: [1, 1, 2, 2]},
  },
  {
    name: 'Throw if the length of padding is not 4.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      padding: [2, 2],
    },
  },
  {
    name: 'Throw if the length of strides is not 2.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      strides: [2],
    },
  },
  {
    name: 'Throw if one stride value is smaller than 1.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      strides: [1, 0],
    },
  },
  {
    name: 'Throw if the length of dilations is not 2.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      dilations: [1],
    },
  },
  {
    name: 'Throw if the one dilation value is smaller than 1.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      dilations: [1, 0],
    },
  },
  {
    name:
        'Throw if the input channels is not equal to the filter input channels.',
    input: {dataType: 'float32', dimensions: [1, 4, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      groups: 3,
    },
  },
  {
    name: 'Throw if output channels is too large.',
    input: {dataType: 'float32', dimensions: [1, 4, 5, 5]},
    filter: {dataType: 'float32', dimensions: [4, 2, 2, 2]},
    options: {
      groups: kMaxUnsignedLong,
    },
  },
  {
    name: 'Throw if the groups is smaller than 1.',
    input: {dataType: 'float32', dimensions: [1, 4, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      groups: 0,
    },
  },
  {
    name: 'Throw due to overflow when calculating the effective filter height.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 434983, 2]},
    options: {
      dilations: [328443, 1],
    },
  },
  {
    name: 'Throw due to overflow when calculating the effective filter width.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 234545]},
    options: {
      dilations: [2, 843452],
    },
  },
  {
    name: 'Throw if the bias is not a 1-D tensor.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      bias: {dataType: 'float32', dimensions: [1, 2]},
    },
  },
  {
    name: 'Throw if the bias shape is not equal to [output_channels].',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      bias: {dataType: 'float32', dimensions: [2]},
    },
  },
  {
    name: 'Throw if the bias data type doesn\'t match input data type.',
    input: {dataType: 'float32', dimensions: [1, 1, 5, 5]},
    filter: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    options: {
      bias: {dataType: 'int32', dimensions: [1]},
    },
  },
  {
    name: 'Throw if the outputPadding is not a sequence of length 2.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      strides: [3, 2],
      outputPadding: [1, 1, 1, 1],
    },
  },
  {
    name:
        'Throw if the outputPadding is greater than stride along the same dimension.',
    input: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [0, 0, 3, 3],
      strides: [2, 2],
      outputPadding: [0, 2],
    },
  },
  {
    name: 'Throw if the outputSizes is not a sequence of length 2.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 2, 3, 3]},
    options: {
      strides: [3, 2],
      outputPadding: [1, 2, 10, 8],
    },
  },
  {
    name: 'Throw due to underflow when calculating the output height.',
    input: {dataType: 'float32', dimensions: [1, 1, 2, 2]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [4, 4, 0, 0],
      strides: [2, 2],
      outputPadding: [1, 0],
    },
  },
  {
    name:
        'Throw due to outputSizes values are smaller than the output sizes calculated by not using outputPadding.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [1, 1, 1, 1],
      strides: [2, 2],
      outputSizes: [4, 4],
      outputPadding: [1, 1],
    },
  },
  {
    name:
        'Throw due to outputSizes values are greater than the output sizes calculated by not using outputPadding.',
    input: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    filter: {dataType: 'float32', dimensions: [1, 1, 3, 3]},
    options: {
      padding: [1, 1, 1, 1],
      strides: [2, 2],
      outputSizes: [6, 8],
      outputPadding: [1, 1],
    },
  },
];

tests.forEach(
    test => promise_test(async t => {
      const input = builder.input(
          'input',
          {dataType: test.input.dataType, dimensions: test.input.dimensions});
      const filter = builder.input(
          'filter',
          {dataType: test.filter.dataType, dimensions: test.filter.dimensions});

      if (test.options && test.options.bias) {
        test.options.bias = builder.input('bias', {
          dataType: test.options.bias.dataType,
          dimensions: test.options.bias.dimensions
        });
      }

      if (test.output) {
        const output = builder.convTranspose2d(input, filter, test.options);
        assert_equals(output.dataType(), test.output.dataType);
        assert_array_equals(output.shape(), test.output.dimensions);
      } else {
        assert_throws_js(
            TypeError,
            () => builder.convTranspose2d(input, filter, test.options));
      }
    }, test.name));
