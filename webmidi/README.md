# TEST for Web MIDI API

Purpose of this test is to confirm whether Web MIDI API run on browsers. (include using [WebMIDIAPIShim](https://github.com/cwilso/WebMIDIAPIShim) and [Jazz-MIDI plugin](http://jazz-soft.net/doc/Jazz-Plugin/)).
And this test is created with W3C's [testharne.js](http://darobin.github.io/test-harness-tutorial/docs/using-testharness.html).)

**List of test:**

 1. List item
 2. requestMIDIAccess()
 3. getInputs()
 4. getOutputs()
 5. getInput()
 6. getOutput
 7. onmessage()
 8. send()
 
**Note:**

- **3, 5, 7**: MIDI input device is required to run the test.
- **4, 6, 8**: MIDI output device is required to run the test. (In most cases in Windows and Mac, software synth is implemented by default. So, you DO NOT need to own MIDI output device to run this test for all of the case.)

**Web MIDI API:**

- Web MIDI API would be Web Standard API, and the spec is defined by HTML5. And having discussion in [audio working group](http://www.w3.org/2011/audio/) of [W3C](http://www.w3.org/).
- Web MIDI API Spec: [http://webaudio.github.io/web-midi-api/](http://webaudio.github.io/web-midi-api/)


**Special Thanks:**

 - [Test the Web Forward](http://testthewebforward.org/)

----------

# Web MIDI APIのテスト

このテストはブラウザでWeb MIDI APIが動作するかを確認することができます。もちろん [WebMIDIAPIShim](https://github.com/cwilso/WebMIDIAPIShim) を [Jazz-MIDI plugin](http://jazz-soft.net/doc/Jazz-Plugin/) 使っている場合も含みます。

**テスト内容一覧:**

 1. List item
 2. requestMIDIAccess()
 3. getInputs()
 4. getOutputs()
 5. getInput()
 6. getOutput
 7. onmessage()
 8. send()

**Note:**

- **3, 5, 7**: MIDI input デバイス が必要です。
- **4, 6, 8**: MIDI input デバイス が必要です。 (ただしほとんどの場合WindowsとMacにはソフトウェアシンセが実装されていますので、ほとんどの場合MIDI Outputデバイスを用意する必要はありません。)

**Web MIDI API:**

- Web MIDI API はWeb標準になるであろうAPIで、その仕様はHTML5として定義されています。また、[W3C](http://www.w3.org/) の [audio working group](http://www.w3.org/2011/audio/) にて議論されています。
- Web MIDI APIの仕様: [http://webaudio.github.io/web-midi-api/](http://webaudio.github.io/web-midi-api/)


**Special Thanks:**

- [Test the Web Forward](http://testthewebforward.org/)




