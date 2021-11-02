const value = new DOMException();
self.postMessage({ value, stack: value.stack });
