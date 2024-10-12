'use strict';

/**
 * This function is used for building WebNN API constant operand from weights
 * .npy file.
 * @param {Object} builder an MLGraphBuilder object.
 * @param {string} url url path of weights .npy file.
 * @returns {Object} an MLOperand object.
 */
const buildConstantByNpy = async (builder, url) => {
  const dataTypeMap = new Map([
    ['f2', {type: 'float16', array: Uint16Array}],
    ['f4', {type: 'float32', array: Float32Array}],
    ['f8', {type: 'float64', array: Float64Array}],
    ['i1', {type: 'int8', array: Int8Array}],
    ['i2', {type: 'int16', array: Int16Array}],
    ['i4', {type: 'int32', array: Int32Array}],
    ['i8', {type: 'int64', array: BigInt64Array}],
    ['u1', {type: 'uint8', array: Uint8Array}],
    ['u2', {type: 'uint16', array: Uint16Array}],
    ['u4', {type: 'uint32', array: Uint32Array}],
    ['u8', {type: 'uint64', array: BigUint64Array}],
  ]);

  console.time(`Fetch ${url}`);
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  console.timeEnd(`Fetch ${url}`);
  const npArray = new numpy.Array(new Uint8Array(buffer));
  if (!dataTypeMap.has(npArray.dataType)) {
    throw new Error(`Data type ${npArray.dataType} is not supported.`);
  }
  const dimensions = npArray.shape;
  const type = dataTypeMap.get(npArray.dataType).type;
  const TypedArrayConstructor = dataTypeMap.get(npArray.dataType).array;
  const dataView = new Uint8Array(npArray.data.buffer);
  const dataView2 = dataView.slice();
  const typedArray = new TypedArrayConstructor(dataView2.buffer);
  const constantOperand = builder.constant({type, dimensions}, typedArray);
  return constantOperand;
};

/**
 * Creates an instance of the element for the specified tagName and source url.
 * @param {string} tagName "img" | "video".
 * @param {string} url
 * @returns {Object} an HTMLElement object.
 */
const createInputElement = async (tagName, url) => {
  return new Promise((resolve) => {
    let element = document.createElement(tagName);
    element.addEventListener('load', () => resolve(element));
    element.src = url;
  });
};

/**
 * This method is used to covert input element to tensor data.
 * @param {Object} inputElement, an object of HTML [<img> | <video>] element.
 * @param {!Object<string, *>} inputOptions, an object of options to process
 * input element.
 * inputOptions = {
 *     inputLayout {String}, // input layout of tensor.
 *     inputDimensions: {!Array<number>}, // dimensions of input tensor.
 *     mean: {Array<number>}, // optional, mean values for processing the input
 *       element. If not specified, it will be set to [0, 0, 0, 0].
 *     std: {Array<number>}, // optional, std values for processing the input
 *       element. If not specified, it will be set to [1, 1, 1, 1].
 *     norm: {Boolean}, // optional, normlization flag. If not specified,
 *       it will be set to false.
 *     scaledFlag: {boolean}, // optional, scaling flag. If specified,
 *       scale the width and height of the input element.
 *     drawOptions: { // optional, drawOptions is used for
 *         CanvasRenderingContext2D.drawImage() method.
 *       sx: {number}, // the x-axis coordinate of the top left corner of
 *         sub-retangle of the source image.
 *       sy: {number}, // the y-axis coordinate of the top left corner of
 *         sub-retangle of the source image.
 *       sWidth: {number}, // the width of the sub-retangle of the
 *         source image.
 *       sHeight: {number}, // the height of the sub-retangle of the
 *         source image.
 *       dWidth: {number}, // the width to draw the image in the destination
 *         canvas.
 *       dHeight: {number}, // the height to draw the image in the destination
 *         canvas.
 *     },
 * };
 * @return {Float32Array} tensor.
 */
const getInputTensor = (inputElement, inputOptions) => {
  const inputDimensions = inputOptions.inputDimensions;
  const tensor =
      new Float32Array(inputDimensions.slice(1).reduce((a, b) => a * b));

  inputElement.width = inputElement.videoWidth || inputElement.naturalWidth;
  inputElement.height = inputElement.videoHeight || inputElement.naturalHeight;

  let [channels, height, width] = inputDimensions.slice(1);
  const mean = inputOptions.mean || [0, 0, 0, 0];
  const std = inputOptions.std || [1, 1, 1, 1];
  const normlizationFlag = inputOptions.norm || false;
  const channelScheme = inputOptions.channelScheme || 'RGB';
  const scaledFlag = inputOptions.scaledFlag || false;
  const inputLayout = inputOptions.inputLayout;
  const imageChannels = 4;  // RGBA
  const drawOptions = inputOptions.drawOptions;
  if (inputLayout === 'nhwc') {
    [height, width, channels] = inputDimensions.slice(1);
  }
  const canvasElement = document.createElement('canvas');
  canvasElement.width = width;
  canvasElement.height = height;
  const canvasContext = canvasElement.getContext('2d');

  if (drawOptions) {
    canvasContext.drawImage(
        inputElement, drawOptions.sx, drawOptions.sy, drawOptions.sWidth,
        drawOptions.sHeight, 0, 0, drawOptions.dWidth, drawOptions.dHeight);
  } else {
    if (scaledFlag) {
      const resizeRatio = Math.max(
          Math.max(inputElement.width / width, inputElement.height / height),
          1);
      const scaledWidth = Math.floor(inputElement.width / resizeRatio);
      const scaledHeight = Math.floor(inputElement.height / resizeRatio);
      canvasContext.drawImage(inputElement, 0, 0, scaledWidth, scaledHeight);
    } else {
      canvasContext.drawImage(inputElement, 0, 0, width, height);
    }
  }

  let pixels = canvasContext.getImageData(0, 0, width, height).data;

  if (normlizationFlag) {
    pixels = new Float32Array(pixels).map((p) => p / 255);
  }

  for (let c = 0; c < channels; ++c) {
    for (let h = 0; h < height; ++h) {
      for (let w = 0; w < width; ++w) {
        let value;
        if (channelScheme === 'BGR') {
          value =
              pixels[h * width * imageChannels + w * imageChannels + (channels - c - 1)];
        } else {
          value = pixels[h * width * imageChannels + w * imageChannels + c];
        }
        if (inputLayout === 'nchw') {
          tensor[c * width * height + h * width + w] =
              (value - mean[c]) / std[c];
        } else {
          tensor[h * width * channels + w * channels + c] =
              (value - mean[c]) / std[c];
        }
      }
    }
  }
  return tensor;
};

/**
 * Get labels array from given label file url.
 * @param {string} url label file url
 * @returns Array<string> labels array
 */
const fetchLabels = async (url) => {
  const response = await fetch(url);
  const data = await response.text();
  return data.split('\n');
};

/**
 * Get top 3 classes of labels and their probabilities.
 * @param {TypedArray} buffer
 * @param {Array<string>} labels
 * @returns Array<Object{label: string, probability: number}>
 */
const getTopClasses = (buffer, labels) => {
  const probabilities = Array.from(buffer);
  const indexes =
      probabilities.map((probability, index) => [probability, index]);
  const sorted = indexes.sort((a, b) => {
    if (a[0] === b[0]) {
      return 0;
    }
    return a[0] < b[0] ? -1 : 1;
  });
  sorted.reverse();
  const classes = [];

  for (let i = 0; i < 3; ++i) {
    const probability = sorted[i][0];
    const index = sorted[i][1];
    const c = {
      label: labels[index],
      probability: (probability * 100).toFixed(2),
    };
    classes.push(c);
  }

  return classes;
};
