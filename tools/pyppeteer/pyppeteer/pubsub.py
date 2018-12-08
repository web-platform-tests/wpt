import threading

class PubSub():
    '''Thread-safe publisher/subscriber implementation, designed to allow
    subscribers to wait for topics without advanced registration in the
    publisher.'''
    def __init__(self):
        self.subscribers = {}
        self.subscribers_lock = threading.Lock()

    def publish(self, topic):
        with self.subscribers_lock:
            if topic not in self.subscribers:
                return

            for subscriber in self.subscribers[topic]:
                subscriber.release()

            del self.subscribers[topic]

    def wait_for(self, topic):
        lock = threading.Lock()
        lock.acquire()

        with self.subscribers_lock:
            if topic not in self.subscribers:
                self.subscribers[topic] = []
            self.subscribers[topic].append(lock)

        lock.acquire()
