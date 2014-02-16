/* global window, document, OfflineAudioContext, Blob, encodeWAV */

/* global ArrayBuffer, Float32Array*/
/* exported encodeWAV */

/**
 * Encode a Web Audio API Audiobuffer to an ArrayBuffer of a
 * 16bit PCM WAV.
 * 
 * @param  {[type]} audioBuffer [description]
 * @return {[type]}             [description]
 */
function encodeWAV(audioBuffer) {

  /** create a single interleaved Float32Array for 2 channels AudioBuffer **/
  var getInterleavedSamplesArray = function (audioBuffer) {
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    } else {
      var channel0 = audioBuffer.getChannelData(0),
        channel1 = audioBuffer.getChannelData(1);
      var length = channel0.length * 2;
      var result = new Float32Array(length);
      var index = 0,
        inputIndex = 0;
      while (index < length) {
        result[index++] = channel0[inputIndex];
        result[index++] = channel1[inputIndex];
        inputIndex++;
      }
      return result;
    }
  };

  /** write 16 bit PCM samples to DataView output **/
  var writeSamples = function (output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  /** Write a string to DataView (byte per character) **/
  var writeString = function (view, offset, string) {
    for (var i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // The main function
  var numberOfChannels = audioBuffer.numberOfChannels;
  if (numberOfChannels > 2) {
    throw new Error("Number of channels > 2 not supported.");
  }
  var sampleRate = audioBuffer.sampleRate;
  var samples = getInterleavedSamplesArray(audioBuffer);
  var blockAlign = 2 * numberOfChannels;


  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numberOfChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  writeSamples(view, 44, samples);

  return buffer;
}

window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;


function connectWhiteNoise(context) {
  var BUFFER_SECONDS = 2;
  var bufferSize = BUFFER_SECONDS * context.sampleRate,
    noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate),
    output = noiseBuffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  var whiteNoise = context.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  whiteNoise.start(0);

  whiteNoise.connect(context.destination);
}


function generateWave() {

  if (!document.getElementById('generateForm').checkValidity()) {
    return;
  }

  var lengthInSeconds = Number(document.getElementById('seconds').value);
  var channels = Number(document.getElementById('channels').value);
  var sampleRate = 44100.0;
  var context = new OfflineAudioContext(channels, sampleRate * lengthInSeconds, sampleRate);

  //context = new AudioContext();

  connectWhiteNoise(context);
  context.startRendering();

  context.addEventListener("complete", function (event) {
    var buffer = event.renderedBuffer;
    //var wave = createWaveFileData(buffer);
    var wave = encodeWAV(buffer);
    var blob = new Blob([wave], {
      type: 'audio/wav'
    });
    var url = window.URL.createObjectURL(blob);

    var audio = window.document.getElementById('generated');
    audio.src = url;
    audio.controls = true;
    window.document.body.appendChild(audio);

    var link = window.document.getElementById('download');
    link.href = url;
    link.download = 'noise_' + lengthInSeconds +'sec_' + channels + 'channels.wav';
    window.document.body.appendChild(link);
  });

}