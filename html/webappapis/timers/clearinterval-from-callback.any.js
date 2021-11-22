async_test((t) => {
  let timesCalled = 0;

  const handle = setInterval(
    t.step_func(() => {
      if (timesCalled === 0) {
        timesCalled++;

        clearInterval(handle);

        // Make the test succeed after the callback would've run next.
        setInterval(t.step_func_done(), 750);
      } else {
        assert_unreached();
      }
    }),
    500
  );
}, "Clearing an interval from the callback should still clear it.");
