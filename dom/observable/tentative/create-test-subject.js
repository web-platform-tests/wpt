/**
 * A helper function to create an Observable that can be externally controlled
 * and examined for testing purposes.
 *
 * @param {object} options - allows for the following optional properties:
 *  - onSubscribe: a function that will be called when a subscriber subscribes
 *  - onTeardown: a function that will be called when a subscriber unsubscribes
 */
export function createTestSubject(options) {
  const onTeardown = options?.onTeardown;

  const subscribers = new Set();
  const subject = new Observable((subscriber) => {
    options?.onSubscribe?.();
    subscribers.add(subscriber);
    subscriber.addTeardown(() => subscribers.delete(subscriber));
    if (onTeardown) {
      subscriber.addTeardown(onTeardown);
    }
  });

  subject.next = (value) => {
    for (const subscriber of Array.from(subscribers)) {
      subscriber.next(value);
    }
  };
  subject.error = (error) => {
    for (const subscriber of Array.from(subscribers)) {
      subscriber.error(error);
    }
  };
  subject.complete = () => {
    for (const subscriber of Array.from(subscribers)) {
      subscriber.complete();
    }
  };
  subject.subscriberCount = () => {
    return subscribers.size;
  };

  return subject;
}
