const kDefaultReading = [1, 0, 0, 0]; // 180 degrees around X axis.
const kRotationMatrix = [1,  0,  0,  0,
                         0, -1,  0,  0,
                         0,  0, -1,  0,
                         0,  0,  0,  1];
const kRotationDOMMatrix = new DOMMatrix(kRotationMatrix);

// 'orientation.angle == 270'
const kMappedReading = [-0.707107, 0.707107, 0, 0];

async function checkQuaternion(t, sensorType, sensorTest) {
  const sensor = new sensorType();
  const eventWatcher = new EventWatcher(t, sensor, ["reading", "error"]);
  sensor.start();

  const mockSensorProvider = await sensorTest.getMockSensorProvider();
  const mockSensor = await mockSensorProvider.getCreatedSensor();
  await mockSensor.setUpdateSensorReadingFunction(update_sensor_reading);

  await eventWatcher.wait_for("reading");
  assert_equals(sensor.quaternion.length, 4);
  assert_true(sensor.quaternion instanceof Array);
  sensor.stop();
};

async function checkPopulateMatrix(t, sensorType, sensorTest) {
  const sensor = new sensorType();
  const eventWatcher = new EventWatcher(t, sensor, ["reading", "error"]);

  //Throws with insufficient buffer space.
  assert_throws({ name: 'TypeError' }, () => sensor.populateMatrix(new Float32Array(15)));

  //Throws if no orientation data available.
  assert_throws({ name: 'NotReadableError' }, () => sensor.populateMatrix(new Float32Array(16)));

  if (window.SharedArrayBuffer) {
    // Throws if passed SharedArrayBuffer view.
    assert_throws({ name: 'TypeError' }, () => sensor.populateMatrix(new Float32Array(new SharedArrayBuffer(16))));
  }

  sensor.start();

  const mockSensorProvider = await sensorTest.getMockSensorProvider();
  const mockSensor = await mockSensorProvider.getCreatedSensor();
  await mockSensor.setUpdateSensorReadingFunction(update_sensor_reading);

  await eventWatcher.wait_for("reading");

  // Works for all supported types.
  const mat_32 = new Float32Array(16);
  sensor.populateMatrix(mat_32);
  assert_array_equals(mat_32, kRotationMatrix);

  const mat_64 = new Float64Array(16);
  sensor.populateMatrix(mat_64);
  assert_array_equals(mat_64, kRotationMatrix);

  const mat_dom = new DOMMatrix();
  sensor.populateMatrix(mat_dom);
  assert_array_equals(mat_dom.toFloat64Array(), kRotationMatrix);

  // Sets every matrix element.
  mat_64.fill(123);
  sensor.populateMatrix(mat_64);
  assert_array_equals(mat_64, kRotationMatrix);

  sensor.stop();
}

function runOrienationSensorTests(sensorName) {
  const sensorType = self[sensorName];

  sensor_test(async (t, sensorTest) => {
    assert_true(sensorName in self);
    return checkQuaternion(t, sensorType, sensorTest);
  }, `${sensorName}.quaternion return a four-element FrozenArray.`);

  sensor_test(async (t, sensorTest) => {
    assert_true(sensorName in self);
    return checkPopulateMatrix(t, sensorType, sensorTest);
  }, `${sensorName}.populateMatrix() method works correctly.`);
}

