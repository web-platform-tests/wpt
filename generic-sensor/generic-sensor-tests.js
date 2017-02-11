function runGenericSensorTests(sensorType, verifyReading) {
  async_test(t => {
    let sensor = new sensorType();
    sensor.onchange = t.step_func_done(() => {
      assert_true(verifyReading(sensor));
      assert_equals(sensor.state, "activated");
      sensor.stop();
    });
    sensor.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor.start();
  }, "event change fired");

  async_test(t => {
    let sensor1 = new sensorType();
    let sensor2 = new sensorType();
    sensor1.onactivate = t.step_func_done(() => {
      // Reading values are correct for both sensors.
      assert_true(verifyReading(sensor1));
      assert_true(verifyReading(sensor2));

      //After first sensor stops its reading values are null,
      //reading values for the second sensor remains
      sensor1.stop();
      assert_true(verifyReading(sensor1, true /*should be null*/));
      assert_true(verifyReading(sensor2));
      sensor2.stop();
      assert_true(verifyReading(sensor2, true /*should be null*/));
    });
    sensor1.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor2.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor1.start();
    sensor2.start();
  }, "sensor reading is correct");

  async_test(t => {
    let sensor = new sensorType();
    let cachedTimeStamp1;
    sensor.onactivate = () => {
      cachedTimeStamp1 = sensor.timestamp;
    };
    sensor.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor.start();
    t.step_timeout(() => {
      sensor.onchange = t.step_func_done(() => {
        //sensor.timestamp changes.
        let cachedTimeStamp2 = sensor.timestamp;
        assert_greater_than(cachedTimeStamp2, cachedTimeStamp1);
        sensor.stop();
        t.done();
      });
    }, 1000);
  }, "timestamp is updated when time passes");

  test(() => {
    let sensor, start_return;
    sensor = new sensorType();
    sensor.onerror = () => {
      assert_unreached(event.error.name + ":" + event.error.message);
    };
    //The default sensor.state is 'unconnected'
    assert_equals(sensor.state, "unconnected");
    start_return = sensor.start();
    //The sensor.state changes to 'activating' after sensor.start()
    assert_equals(sensor.state, "activating");
    //TODO: The permission is not ready.
    //the sensor.start() return undefined
    assert_equals(start_return, undefined);
    sensor.stop();
  }, "sensor.start() is correct");

  test(() => {
    let sensor, stop_return;
    sensor = new sensorType();
    sensor.onerror = () => {
      assert_unreached(event.error.name + ":" + event.error.message);
    };
    sensor.start();
    stop_return = sensor.stop();
    //The sensor.state changes to 'idle' after sensor.stop()
    assert_equals(sensor.state, "idle");
    //the sensor.stop() returns undefined
    assert_equals(stop_return, undefined);
  }, "sensor.stop() is correct");

  async_test(t => {
    window.onmessage = t.step_func(e => {
      assert_equals(e.data, "SecurityError");
      t.done();
    });
  }, "throw a 'SecurityError' when firing sensor readings within iframes");

  async_test(t => {
    let sensor = new sensorType();
    sensor.onactivate = t.step_func_done(() => {
      assert_true(verifyReading(sensor));
      let cachedSensor = sensor;
      let win = window.open('', '_blank');
      assert_equals(sensor, cachedSensor);
      win.close();
      sensor.stop();
    });
    sensor.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor.start();
  }, "sensor readings can not be fired on the background tab");
}

function runGenericSensorInsecureContext(sensorType) {
  test(() => {
    assert_throws('SecurityError', () => {
      let sensor = new sensorType();
    });
  }, "throw a 'SecurityError' when construct sensor in an insecure context");
}

function runGenericSensorOnerror(sensorType) {
  async_test(t => {
    let sensor = new sensorType();
    sensor.onactivate = t.step_func_done(assert_unreached);
    sensor.onerror = t.step_func_done(event => {
      assert_equals(sensor.state, 'errored');
      assert_equals(event.error.name, 'NotReadableError');
    });
    sensor.start();
  }, "'onerror' event is fired when sensor is not supported");
}

function runSensorFrequency(sensorType) {
  test(() => {
    assert_throws(new RangeError(), () => new sensorType({frequency: -60}));
  }, "negative frequency causes exception from constructor");

  async_test(t => {
    let sensor = new sensorType({frequency: 600});
    let number = 0;
    sensor.onchange = () => {
      number++;
    };
    sensor.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor.start();
    t.step_timeout(() => {
      assert_less_than_equal(number, 60);
      sensor.stop();
      t.done();
    }, 1000);
  }, "frequency is capped to 60.0 Hz");
}
