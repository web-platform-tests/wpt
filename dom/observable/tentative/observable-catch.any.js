// Because we test that the global error handler is called at various times.
setup({ allow_uncaught_exception: true });

test(() => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.next(3);
        subscriber.complete();
    });

    const caughtObservable = source.catch(() => {
        assert_unreached('catch() should not be called');
    });

    const results = [];

    caughtObservable.subscribe({
        next: value => results.push(value),
        complete: () => results.push('complete')
    });

    assert_array_equals(results, [1, 2, 3, 'complete'], 'catch() should return an observable that is a pass-through for next/complete');

}, 'catch(): should return an observable that is a pass-through for next/complete');

test(() => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.error(new Error('from the source'));
    });

    const caughtObservable = source.catch(error => {
        assert_true(error instanceof Error);
        assert_equals(error.message, 'from the source');
        return new Observable(subscriber => {
            subscriber.next(3);
            subscriber.complete();
        });
    });

    const results = [];

    caughtObservable.subscribe({
        next: value => results.push(value),
        complete: () => results.push('complete')
    });

    assert_array_equals(results, [1, 2, 3, 'complete'], 'catch() should handle errors from the source and flatten to a new observable');
}, 'catch(): should handle errors from the source and flatten to a new observable');

test(() => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.error(new Error('from the source'));
    });

    const caughtObservable = source.catch(error => {
        assert_true(error instanceof Error);
        assert_equals(error.message, 'from the source');
        throw new Error('from the catch callback');
    });

    const results = [];

    caughtObservable.subscribe({
        next: value => results.push(value),
        error: error => {
            assert_true(error instanceof Error);
            results.push(error.message)
        },
        complete: () => results.push('complete')
    });

    assert_array_equals(results, [1, 2, 'from the catch callback'], 'errors thrown in the catch() callback should be sent to the consumer');
}, 'catch(): errors thrown in the catch() callback should be sent to the consumer');

test(() => {
    // A common use case is logging and keeping the stream alive.
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.next(3);
        subscriber.complete();
    });

    function errorsOnTwo(value) {
        return new Observable(subscriber => {
            if (value === 2) {
                subscriber.error(new Error('from the flattening operation'));
            } else {
                subscriber.next(value);
                subscriber.complete();
            }
        });
    }

    const results = [];

    source.flatMap(value => errorsOnTwo(value)
        .catch(error => {
            results.push(error.message);
            return [];
        })
    ).subscribe({
        next: value => results.push(value),
        complete: () => results.push('complete')
    });

    assert_array_equals(results, [1, 'from the flattening operation', 3, 'complete'], 'catch(): should be usable for handling errors in a flattening operation');

}, 'catch(): should be able to handle returning an empty observable as an array in a flattening operation');

promise_test(async () => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.error(new Error('from the source'));
    });

    const caughtObservable = source.catch(error => {
        assert_true(error instanceof Error);
        assert_equals(error.message, 'from the source');
        return Promise.resolve(3);
    });

    const results = await caughtObservable.toArray();

    assert_array_equals(results, [1, 2, 3], 'catch(): should handle returning a promise');
}, 'catch(): should handle returning a promise');

promise_test(async () => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.error(new Error('from the source'));
    });

    const caughtObservable = source.catch(async function* (error) {
        assert_true(error instanceof Error);
        assert_equals(error.message, 'from the source');
        yield 3;
    });

    const results = await caughtObservable.toArray();

    assert_array_equals(results, [1, 2, 3], 'catch(): should handle returning an observable');
}, 'catch(): should handle returning an async iterable');

test(() => {
    const source = new Observable(subscriber => {
        subscriber.next(1);
        subscriber.next(2);
        subscriber.error(new Error('from the source'));
    });

    const caughtObservable = source.catch(error => {
        assert_true(error instanceof Error);
        assert_equals(error.message, 'from the source');
        return 3;
    });

    const results = [];

    caughtObservable.subscribe({
        next: value => results.push(value),
        error: error => {
            assert_true(error instanceof Error);
            results.push('ERROR');
        },
        complete: () => results.push('complete')
    });

    assert_array_equals(results, [1, 2, 'ERROR'], 'catch(): should emit an error if a value is returned that is not convertable to an observable');
}, 'catch(): should emit an error if a value is returned that is not convertable to an observable')