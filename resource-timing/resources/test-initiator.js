function testResourceInitiator(resourceName, expectedInitiator) {
  return new Promise((resolve, reject) => {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntriesByType('resource');
      for (const entry of entries) {
        if (entry.name.endsWith(resourceName)) {
          observer.disconnect();
          try {
            assert_equals(
                entry.initiator, expectedInitiator,
                `Test ${resourceName} initiator`);
            resolve();
            return;
          } catch (error) {
            reject(error);
          }
        }
      }
    });
    observer.observe({type: 'resource', buffered: true});
  });
}
