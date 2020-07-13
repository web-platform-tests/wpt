// This should be removed when the webaudio/historical.html tests are passing.
// Tracking bug: https://bugs.webkit.org/show_bug.cgi?id=204719
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var FFT_SIZE = 2048;

function getPitchDetector(media, t) {
  var audioContext = new AudioContext();
  t.add_cleanup(() => audioContext.close());

  var sourceNode = audioContext.createMediaElementSource(media);

  var analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;

  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  // Returns the frequency value for the nth FFT bin.
  var binConverter = (bin) => audioContext.sampleRate*(bin/FFT_SIZE);

  return () => getPitch(analyser, binConverter);
}

function getPitch(analyser, binConverter) {
  var buf = new Uint8Array(FFT_SIZE/2);
  analyser.getByteFrequencyData(buf);
  return findDominantFrequency(buf, binConverter);
}

// Returns the dominant frequency, +/- a certain margin.
function findDominantFrequency(buf, binConverter) {
  var max = 0;
  var bin = 0;

  for (var i=0;i<buf.length;i++) {
    if(buf[i] > max) {
      max = buf[i];
      bin = i;
    }
  }

  // The distance between bins is always constant and corresponds to
  // (1/FFT_SIZE)th of the sample rate. Use the frequency value of the 1st bin
  // as the margin directly, instead of calculating an average from the values
  // of the neighboring bins.
  return { value:binConverter(bin), margin:binConverter(1) };
}