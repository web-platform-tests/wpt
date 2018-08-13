// META: global=!default,window
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// TODO(ricea): Merge into the main encoding.idl file once the standard changes have landed.
'use strict';

const untested_idl = `
interface Window {};
interface ReadableStream {};
interface WritableStream {};
`;

const idl = `
dictionary TextDecoderOptions {
  boolean fatal = false;
  boolean ignoreBOM = false;
};

interface mixin TextDecoderCommon {
  readonly attribute DOMString encoding;
  readonly attribute boolean fatal;
  readonly attribute boolean ignoreBOM;
};

interface mixin TextEncoderCommon {
  readonly attribute DOMString encoding;
};

interface mixin GenericTransformStream {
  readonly attribute ReadableStream readable;
  readonly attribute WritableStream writable;
};

[Constructor(optional DOMString label = "utf-8", optional TextDecoderOptions options),
 Exposed=(Window,Worker)]
interface TextDecoderStream {
};
TextDecoderStream includes TextDecoderCommon;
TextDecoderStream includes GenericTransformStream;

[Constructor,
 Exposed=(Window,Worker)]
interface TextEncoderStream {
};
TextEncoderStream includes TextEncoderCommon;
TextEncoderStream includes GenericTransformStream;
`;

var idl_array = new IdlArray();
idl_array.add_untested_idls(untested_idl);
idl_array.add_idls(idl);
idl_array.add_objects({
  TextEncoderStream: ['new TextEncoderStream()'],
  TextDecoderStream: ['new TextDecoderStream()']
});
idl_array.test();
