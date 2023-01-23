let singleton;
class Singleton extends AudioWorkletProcessor {
  constructor() {
    if (!singleton) {
      singleton = new AudioWorkletProcessor();
    }
    return singleton;
  }
  process(){
    this.port.postMessage({message: "process called"});
    return false;
  }
}
registerProcessor("singleton", Singleton);
