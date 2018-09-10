import * as module from './export-on-load-script.js';

/*
self.addEventListener('message', (e) => {
  e.source.postMessage(module.importedModules);
});
*/

postMessage(module.importedModules);
