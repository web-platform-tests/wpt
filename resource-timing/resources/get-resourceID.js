function getResourceID(resourceName) {
  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntriesByType("resource");
      for (const entry of entries) {
        if (entry.name.endsWith(resourceName)) {
          observer.disconnect();
          resolve(`${entry.resourceId}`);
          return;
        }
      }
    });
    observer.observe({ entryTypes: ["resource"] });
  });
}

function getDocumentResourceID() {
  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntriesByType("navigation");
      if (entries.length > 0) {
        const {resourceId} = entries[0];
        observer.disconnect();
        resolve(resourceId);
      }
    });
    observer.observe({ entryTypes: ["navigation"] });
  });
}
