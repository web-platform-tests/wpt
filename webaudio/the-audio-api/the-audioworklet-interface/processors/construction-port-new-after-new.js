class NewAfterNew extends AudioWorkletProcessor {
  constructor() {
    const processor = new AudioWorkletProcessor()
    let message = {threw: false};
    try {
      new AudioWorkletProcessor();
    } catch (e) {
      message.threw = true;
      message.errorName = e.name;
      message.isTypeError = e instanceof TypeError;
    }
    processor.port.postMessage(message);
    return processor;
  }
  process(){}
}
registerProcessor("new-after-new", NewAfterNew);
