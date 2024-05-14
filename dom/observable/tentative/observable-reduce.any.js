promise_test(async () => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.next(3);
        setTimeout(() => subscriber.complete(), 0);
    });

    const reducerArguments = [];

    const promiseToResult = source.reduce((acc, value, index) => {
        reducerArguments.push([acc, value, index]);
        return acc + value;
    }, 0);

    // The reducer should be called immediately when the source emits a value.
    assert_array_equals(reducerArguments, [
        [0, 1, 0],
        [1, 2, 1],
        [3, 3, 2]
    ]);


    const result = await promiseToResult;

    assert_equals(result, 6);
}, "reduce(): should reduce the values of the observable, starting with a provided seed value");

promise_test(async () => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.error(new Error('from the source'));
    });

    let thrownError = null;
    try {
        await source.reduce((acc, value) => acc + value, 0);
    } catch (error) {
        thrownError = error;
    }

    assert_true(thrownError instanceof Error);
    assert_equals(thrownError.message, 'from the source');
}, 'reduce(): should reject if the source observable emits an error');

promise_test(async () => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.next(3);
        setTimeout(() => subscriber.complete(), 0);
    });

    const reducerArguments = [];

    const promiseToResult = source.reduce((acc, value, index) => {
        reducerArguments.push([acc, value, index]);
        return acc + value;
    });

    // The reducer should be called immediately when the source emits a value.
    assert_array_equals(reducerArguments, [
        [1, 2, 1],
        [3, 3, 2]
    ]);

    const result = await promiseToResult;

    assert_equals(result, 6);
}, 'reduce(): should seed with the first value from the source if no seed value is provided');

promise_test(async () => {
    const logs = [];

    const source = new Observable(subscriber => {
        subscriber.addTeardown(() => logs.push('teardown'));
        logs.push('next 1');
        subscriber.next(1);
        logs.push('next 2');
        subscriber.next(2);
        logs.push('try to next 3');
        subscriber.next(3);
        logs.push('try to complete');
        subscriber.complete();
    });

    let thrownError = null;

    try {
        await source.reduce((acc, value) => {
            if (value === 2) {
                logs.push('throw error')
                throw new Error('from the reducer');
            }
            return acc + value;
        }, 0);
    } catch (error) {
        thrownError = error;
    }

    assert_true(thrownError instanceof Error);
    assert_equals(thrownError.message, 'from the reducer');

    assert_array_equals(logs, [
        'next 1',
        'next 2',
        'throw error',
        'teardown',
        'try to next 3',
        'try to complete'
    ]);

}, 'reduce(): an error thrown in the reducer should reject the promise and abort the source');

promise_test(async () => {
    const source = new Observable(subscriber => {
        subscriber.complete();
    });

    const result = await source.reduce(() => 'reduced', 'seed');

    assert_equals(result, 'seed');
}, 'reduce(): if the source is empty, the promise should resolve with the seed value');

promise_test(async () => {
    // analogous to `[].reduce(() => 'reduced')`. This should throw a TypeError.

    const source = new Observable(subscriber => {
        subscriber.complete();
    });

    let thrownError = null;
    try {
        await source.reduce(() => 'reduced');
    } catch (error) {
        thrownError = error;
    }

    assert_true(thrownError instanceof TypeError);
}, 'reduce(): if the source is empty, and no seed value is provided, the promise should reject with a TypeError');

promise_test(async () => {
    let tornDown = false;
    const source = new Observable((subscriber) => {
        subscriber.addTeardown(() => {
            tornDown = true;
        });
        // Waits forever.
    });

    const abortController = new AbortController();

    setTimeout(() => {
        abortController.abort();
        assert_true(tornDown);
    }, 0);

    let thrownError = null;
    try {
        await source.reduce(() => 'reduced', 'seed', { signal: abortController.signal });
    } catch (error) {
        thrownError = error;
    }

    assert_true(thrownError instanceof DOMException);
    assert_equals(thrownError.name, 'AbortError');
}, 'reduce(): should reject with an AbortError if the subscription is aborted before the source completes');