onmessage = async e => {
  await navigator.mediaDevices.getUserMedia({audio: true, video: true});
  const devices = await navigator.mediaDevices.enumerateDevices();
  e.source.postMessage({
    devices: devices.map(d => d.toJSON())
  }, '*');
}
