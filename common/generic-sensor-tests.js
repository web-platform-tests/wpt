function runGenericSensorTests(sensorType, readingType, verifyReading) {
  async_test(t => {
    let sensor = new sensorType();
    sensor.onchange = t.step_func_done(() => {
      assert_true(verifyReading(sensor.reading));
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
      let cachedReading1 = sensor1.reading;
      let cached1 = cachedReading1;
      let cachedReading2 = sensor2.reading;
      //both sensors share the same reading instance
      assert_equals(cachedReading1, cachedReading2);
      //after first sensor stops its reading is null, second sensor remains
      sensor1.stop();
      assert_equals(sensor1.reading, null);
      assert_true(sensor2.reading instanceof readingType);
      sensor2.stop();
      assert_equals(sensor2.reading, null);
      //sensor reading must be immutable
      let cached2 = cachedReading1;
      assert_equals(cachedReading1, cachedReading2);
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
    let cachedReading1;
    let cachedTimeStamp1;
    sensor.onactivate = () => {
      cachedReading1 = sensor.reading;
      cachedTimeStamp1 = sensor.reading.timeStamp;
    };
    sensor.onerror = t.step_func_done(event => {
      assert_unreached(event.error.name + ":" + event.error.message);
    });
    sensor.start();
    t.step_timeout(() => {
      sensor.onchange = t.step_func_done(() => {
        let cachedReading2 = sensor.reading;
        assert_not_equals(cachedReading1, cachedReading2);
        //sensor.reading.timeStamp need change.
        let cachedTimeStamp2 = sensor.reading.timeStamp;
        assert_greater_than(cachedTimeStamp2, cachedTimeStamp1);
        sensor.stop();
        t.done();
      });
    }, 1000);
  }, "the sensor reading is updated when time passes");

  test(() => {
    let sensor, start_return;
    sensor = new sensorType();
    sensor.onerror = () => {
      assert_unreached(event.error.name + ":" + event.error.message);
    };
    //The default sensor.reading is 'null'
    assert_equals(sensor.reading, null);
    //The default sensor.state is 'idle'
    assert_equals(sensor.state, "idle");
    start_return = sensor.start();
    //The sensor.state changes to 'activating' after sensor.start()
    assert_equals(sensor.state, "activating");
    //TODO: The permission is not ready.
    //the sensor.start() return undefined
    assert_equals(start_return, undefined);
    //throw an InvalidStateError exception when state is neither idle nor errored
    assert_throws("InvalidStateError", () => { sensor.start(); }, "start() twice");
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
    //the sensor.reading is null after executing stop() method
    assert_equals(sensor.reading, null);
    //throw an InvalidStateError exception when state is either idle or errored
    assert_throws("InvalidStateError", () => { sensor.stop(); }, "stop() twice");
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
      assert_not_equals(sensor.reading, null);
      let cachedReading = sensor.reading;
      let win = window.open('', '_blank');
      assert_equals(sensor.reading, cachedReading);
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
      assert_equals(sensor.reading, null);
      assert_equals(sensor.state, 'errored');
      assert_equals(event.error.name, 'NotFoundError');
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
