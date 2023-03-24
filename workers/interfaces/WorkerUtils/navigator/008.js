"use strict";
let log = [];
const neverEncounteredValue = "This is not the value you are looking for.";
for (const x in navigator) {
  // skip functions, as they are settable
  if (typeof navigator[x] === 'function') continue;
  // this should throw in strict mode per webidl
  try{
    navigator[x] = neverEncounteredValue;
    log.push(x);
  } catch(err){}
}
postMessage(log.join(', '));