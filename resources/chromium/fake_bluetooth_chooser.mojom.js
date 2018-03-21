// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

(function() {
  var mojomId = 'content/shell/common/layout_test/fake_bluetooth_chooser.mojom';
  if (mojo.internal.isMojomLoaded(mojomId)) {
    console.warn('The following mojom is loaded multiple times: ' + mojomId);
    return;
  }
  mojo.internal.markMojomLoaded(mojomId);
  var bindings = mojo;
  var associatedBindings = mojo;
  var codec = mojo.internal;
  var validator = mojo.internal;

  var exports = mojo.internal.exposeNamespace('content.mojom');


  var ChooserEventType = {};
  ChooserEventType.CHOOSER_OPENED = 0;
  ChooserEventType.CHOOSER_CLOSED = ChooserEventType.CHOOSER_OPENED + 1;
  ChooserEventType.ADAPTER_REMOVED = ChooserEventType.CHOOSER_CLOSED + 1;
  ChooserEventType.ADAPTER_DISABLED = ChooserEventType.ADAPTER_REMOVED + 1;
  ChooserEventType.ADAPTER_ENABLED = ChooserEventType.ADAPTER_DISABLED + 1;
  ChooserEventType.DISCOVERY_FAILED_TO_START = ChooserEventType.ADAPTER_ENABLED + 1;
  ChooserEventType.DISCOVERING = ChooserEventType.DISCOVERY_FAILED_TO_START + 1;
  ChooserEventType.DISCOVERY_IDLE = ChooserEventType.DISCOVERING + 1;
  ChooserEventType.ADD_OR_UPDATE_DEVICE = ChooserEventType.DISCOVERY_IDLE + 1;

  ChooserEventType.isKnownEnumValue = function(value) {
    switch (value) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return true;
    }
    return false;
  };

  ChooserEventType.validate = function(enumValue) {
    var isExtensible = false;
    if (isExtensible || this.isKnownEnumValue(enumValue))
      return validator.validationError.NONE;

    return validator.validationError.UNKNOWN_ENUM_VALUE;
  };

  function FakeBluetoothChooserEvent(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooserEvent.prototype.initDefaults_ = function() {
    this.type = 0;
    this.origin = null;
    this.peripheralAddress = null;
  };
  FakeBluetoothChooserEvent.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooserEvent.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 32}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;


    // validate FakeBluetoothChooserEvent.type
    err = messageValidator.validateEnum(offset + codec.kStructHeaderSize + 0, ChooserEventType);
    if (err !== validator.validationError.NONE)
        return err;


    // validate FakeBluetoothChooserEvent.origin
    err = messageValidator.validateStringPointer(offset + codec.kStructHeaderSize + 8, true)
    if (err !== validator.validationError.NONE)
        return err;


    // validate FakeBluetoothChooserEvent.peripheralAddress
    err = messageValidator.validateStringPointer(offset + codec.kStructHeaderSize + 16, true)
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooserEvent.encodedSize = codec.kStructHeaderSize + 24;

  FakeBluetoothChooserEvent.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooserEvent();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    val.type = decoder.decodeStruct(codec.Int32);
    decoder.skip(1);
    decoder.skip(1);
    decoder.skip(1);
    decoder.skip(1);
    val.origin = decoder.decodeStruct(codec.NullableString);
    val.peripheralAddress = decoder.decodeStruct(codec.NullableString);
    return val;
  };

  FakeBluetoothChooserEvent.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooserEvent.encodedSize);
    encoder.writeUint32(0);
    encoder.encodeStruct(codec.Int32, val.type);
    encoder.skip(1);
    encoder.skip(1);
    encoder.skip(1);
    encoder.skip(1);
    encoder.encodeStruct(codec.NullableString, val.origin);
    encoder.encodeStruct(codec.NullableString, val.peripheralAddress);
  };
  function FakeBluetoothChooser_SetServerClient_Params(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooser_SetServerClient_Params.prototype.initDefaults_ = function() {
    this.client = new associatedBindings.AssociatedInterfacePtrInfo();
  };
  FakeBluetoothChooser_SetServerClient_Params.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooser_SetServerClient_Params.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 16}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;


    // validate FakeBluetoothChooser_SetServerClient_Params.client
    err = messageValidator.validateAssociatedInterface(offset + codec.kStructHeaderSize + 0, false);
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooser_SetServerClient_Params.encodedSize = codec.kStructHeaderSize + 8;

  FakeBluetoothChooser_SetServerClient_Params.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooser_SetServerClient_Params();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    val.client = decoder.decodeStruct(codec.AssociatedInterfacePtrInfo);
    return val;
  };

  FakeBluetoothChooser_SetServerClient_Params.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooser_SetServerClient_Params.encodedSize);
    encoder.writeUint32(0);
    encoder.encodeStruct(codec.AssociatedInterfacePtrInfo, val.client);
  };
  function FakeBluetoothChooser_SetServerClient_ResponseParams(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooser_SetServerClient_ResponseParams.prototype.initDefaults_ = function() {
  };
  FakeBluetoothChooser_SetServerClient_ResponseParams.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooser_SetServerClient_ResponseParams.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 8}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooser_SetServerClient_ResponseParams.encodedSize = codec.kStructHeaderSize + 0;

  FakeBluetoothChooser_SetServerClient_ResponseParams.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooser_SetServerClient_ResponseParams();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    return val;
  };

  FakeBluetoothChooser_SetServerClient_ResponseParams.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooser_SetServerClient_ResponseParams.encodedSize);
    encoder.writeUint32(0);
  };
  function FakeBluetoothChooser_SelectPeripheral_Params(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooser_SelectPeripheral_Params.prototype.initDefaults_ = function() {
    this.peripheralAddress = null;
  };
  FakeBluetoothChooser_SelectPeripheral_Params.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooser_SelectPeripheral_Params.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 16}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;


    // validate FakeBluetoothChooser_SelectPeripheral_Params.peripheralAddress
    err = messageValidator.validateStringPointer(offset + codec.kStructHeaderSize + 0, false)
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooser_SelectPeripheral_Params.encodedSize = codec.kStructHeaderSize + 8;

  FakeBluetoothChooser_SelectPeripheral_Params.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooser_SelectPeripheral_Params();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    val.peripheralAddress = decoder.decodeStruct(codec.String);
    return val;
  };

  FakeBluetoothChooser_SelectPeripheral_Params.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooser_SelectPeripheral_Params.encodedSize);
    encoder.writeUint32(0);
    encoder.encodeStruct(codec.String, val.peripheralAddress);
  };
  function FakeBluetoothChooser_Cancel_Params(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooser_Cancel_Params.prototype.initDefaults_ = function() {
  };
  FakeBluetoothChooser_Cancel_Params.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooser_Cancel_Params.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 8}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooser_Cancel_Params.encodedSize = codec.kStructHeaderSize + 0;

  FakeBluetoothChooser_Cancel_Params.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooser_Cancel_Params();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    return val;
  };

  FakeBluetoothChooser_Cancel_Params.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooser_Cancel_Params.encodedSize);
    encoder.writeUint32(0);
  };
  function FakeBluetoothChooser_Rescan_Params(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooser_Rescan_Params.prototype.initDefaults_ = function() {
  };
  FakeBluetoothChooser_Rescan_Params.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooser_Rescan_Params.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 8}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooser_Rescan_Params.encodedSize = codec.kStructHeaderSize + 0;

  FakeBluetoothChooser_Rescan_Params.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooser_Rescan_Params();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    return val;
  };

  FakeBluetoothChooser_Rescan_Params.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooser_Rescan_Params.encodedSize);
    encoder.writeUint32(0);
  };
  function FakeBluetoothChooser_Rescan_ResponseParams(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooser_Rescan_ResponseParams.prototype.initDefaults_ = function() {
  };
  FakeBluetoothChooser_Rescan_ResponseParams.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooser_Rescan_ResponseParams.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 8}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooser_Rescan_ResponseParams.encodedSize = codec.kStructHeaderSize + 0;

  FakeBluetoothChooser_Rescan_ResponseParams.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooser_Rescan_ResponseParams();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    return val;
  };

  FakeBluetoothChooser_Rescan_ResponseParams.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooser_Rescan_ResponseParams.encodedSize);
    encoder.writeUint32(0);
  };
  function FakeBluetoothChooserServerClient_SendEvent_Params(values) {
    this.initDefaults_();
    this.initFields_(values);
  }


  FakeBluetoothChooserServerClient_SendEvent_Params.prototype.initDefaults_ = function() {
    this.event = null;
  };
  FakeBluetoothChooserServerClient_SendEvent_Params.prototype.initFields_ = function(fields) {
    for(var field in fields) {
        if (this.hasOwnProperty(field))
          this[field] = fields[field];
    }
  };

  FakeBluetoothChooserServerClient_SendEvent_Params.validate = function(messageValidator, offset) {
    var err;
    err = messageValidator.validateStructHeader(offset, codec.kStructHeaderSize);
    if (err !== validator.validationError.NONE)
        return err;

    var kVersionSizes = [
      {version: 0, numBytes: 16}
    ];
    err = messageValidator.validateStructVersion(offset, kVersionSizes);
    if (err !== validator.validationError.NONE)
        return err;


    // validate FakeBluetoothChooserServerClient_SendEvent_Params.event
    err = messageValidator.validateStructPointer(offset + codec.kStructHeaderSize + 0, FakeBluetoothChooserEvent, false);
    if (err !== validator.validationError.NONE)
        return err;

    return validator.validationError.NONE;
  };

  FakeBluetoothChooserServerClient_SendEvent_Params.encodedSize = codec.kStructHeaderSize + 8;

  FakeBluetoothChooserServerClient_SendEvent_Params.decode = function(decoder) {
    var packed;
    var val = new FakeBluetoothChooserServerClient_SendEvent_Params();
    var numberOfBytes = decoder.readUint32();
    var version = decoder.readUint32();
    val.event = decoder.decodeStructPointer(FakeBluetoothChooserEvent);
    return val;
  };

  FakeBluetoothChooserServerClient_SendEvent_Params.encode = function(encoder, val) {
    var packed;
    encoder.writeUint32(FakeBluetoothChooserServerClient_SendEvent_Params.encodedSize);
    encoder.writeUint32(0);
    encoder.encodeStructPointer(FakeBluetoothChooserEvent, val.event);
  };
  var kFakeBluetoothChooser_SetServerClient_Name = 450521137;
  var kFakeBluetoothChooser_SelectPeripheral_Name = 268441286;
  var kFakeBluetoothChooser_Cancel_Name = 906659271;
  var kFakeBluetoothChooser_Rescan_Name = 1420838878;

  function FakeBluetoothChooserPtr(handleOrPtrInfo) {
    this.ptr = new bindings.InterfacePtrController(FakeBluetoothChooser,
                                                   handleOrPtrInfo);
  }

  function FakeBluetoothChooserAssociatedPtr(associatedInterfacePtrInfo) {
    this.ptr = new associatedBindings.AssociatedInterfacePtrController(
        FakeBluetoothChooser, associatedInterfacePtrInfo);
  }

  FakeBluetoothChooserAssociatedPtr.prototype =
      Object.create(FakeBluetoothChooserPtr.prototype);
  FakeBluetoothChooserAssociatedPtr.prototype.constructor =
      FakeBluetoothChooserAssociatedPtr;

  function FakeBluetoothChooserProxy(receiver) {
    this.receiver_ = receiver;
  }
  FakeBluetoothChooserPtr.prototype.setServerClient = function() {
    return FakeBluetoothChooserProxy.prototype.setServerClient
        .apply(this.ptr.getProxy(), arguments);
  };

  FakeBluetoothChooserProxy.prototype.setServerClient = function(client) {
    var params = new FakeBluetoothChooser_SetServerClient_Params();
    params.client = client;
    return new Promise(function(resolve, reject) {
      var builder = new codec.MessageV2Builder(
          kFakeBluetoothChooser_SetServerClient_Name,
          codec.align(FakeBluetoothChooser_SetServerClient_Params.encodedSize),
          codec.kMessageExpectsResponse, 0);
      builder.setPayload(FakeBluetoothChooser_SetServerClient_Params, params);
      var message = builder.finish();
      this.receiver_.acceptAndExpectResponse(message).then(function(message) {
        var reader = new codec.MessageReader(message);
        var responseParams =
            reader.decodeStruct(FakeBluetoothChooser_SetServerClient_ResponseParams);
        resolve(responseParams);
      }).catch(function(result) {
        reject(Error("Connection error: " + result));
      });
    }.bind(this));
  };
  FakeBluetoothChooserPtr.prototype.selectPeripheral = function() {
    return FakeBluetoothChooserProxy.prototype.selectPeripheral
        .apply(this.ptr.getProxy(), arguments);
  };

  FakeBluetoothChooserProxy.prototype.selectPeripheral = function(peripheralAddress) {
    var params = new FakeBluetoothChooser_SelectPeripheral_Params();
    params.peripheralAddress = peripheralAddress;
    var builder = new codec.MessageV0Builder(
        kFakeBluetoothChooser_SelectPeripheral_Name,
        codec.align(FakeBluetoothChooser_SelectPeripheral_Params.encodedSize));
    builder.encodeStruct(FakeBluetoothChooser_SelectPeripheral_Params, params);
    var message = builder.finish();
    this.receiver_.accept(message);
  };
  FakeBluetoothChooserPtr.prototype.cancel = function() {
    return FakeBluetoothChooserProxy.prototype.cancel
        .apply(this.ptr.getProxy(), arguments);
  };

  FakeBluetoothChooserProxy.prototype.cancel = function() {
    var params = new FakeBluetoothChooser_Cancel_Params();
    var builder = new codec.MessageV0Builder(
        kFakeBluetoothChooser_Cancel_Name,
        codec.align(FakeBluetoothChooser_Cancel_Params.encodedSize));
    builder.encodeStruct(FakeBluetoothChooser_Cancel_Params, params);
    var message = builder.finish();
    this.receiver_.accept(message);
  };
  FakeBluetoothChooserPtr.prototype.rescan = function() {
    return FakeBluetoothChooserProxy.prototype.rescan
        .apply(this.ptr.getProxy(), arguments);
  };

  FakeBluetoothChooserProxy.prototype.rescan = function() {
    var params = new FakeBluetoothChooser_Rescan_Params();
    return new Promise(function(resolve, reject) {
      var builder = new codec.MessageV1Builder(
          kFakeBluetoothChooser_Rescan_Name,
          codec.align(FakeBluetoothChooser_Rescan_Params.encodedSize),
          codec.kMessageExpectsResponse, 0);
      builder.encodeStruct(FakeBluetoothChooser_Rescan_Params, params);
      var message = builder.finish();
      this.receiver_.acceptAndExpectResponse(message).then(function(message) {
        var reader = new codec.MessageReader(message);
        var responseParams =
            reader.decodeStruct(FakeBluetoothChooser_Rescan_ResponseParams);
        resolve(responseParams);
      }).catch(function(result) {
        reject(Error("Connection error: " + result));
      });
    }.bind(this));
  };

  function FakeBluetoothChooserStub(delegate) {
    this.delegate_ = delegate;
  }
  FakeBluetoothChooserStub.prototype.setServerClient = function(client) {
    return this.delegate_ && this.delegate_.setServerClient && this.delegate_.setServerClient(client);
  }
  FakeBluetoothChooserStub.prototype.selectPeripheral = function(peripheralAddress) {
    return this.delegate_ && this.delegate_.selectPeripheral && this.delegate_.selectPeripheral(peripheralAddress);
  }
  FakeBluetoothChooserStub.prototype.cancel = function() {
    return this.delegate_ && this.delegate_.cancel && this.delegate_.cancel();
  }
  FakeBluetoothChooserStub.prototype.rescan = function() {
    return this.delegate_ && this.delegate_.rescan && this.delegate_.rescan();
  }

  FakeBluetoothChooserStub.prototype.accept = function(message) {
    var reader = new codec.MessageReader(message);
    switch (reader.messageName) {
    case kFakeBluetoothChooser_SelectPeripheral_Name:
      var params = reader.decodeStruct(FakeBluetoothChooser_SelectPeripheral_Params);
      this.selectPeripheral(params.peripheralAddress);
      return true;
    case kFakeBluetoothChooser_Cancel_Name:
      var params = reader.decodeStruct(FakeBluetoothChooser_Cancel_Params);
      this.cancel();
      return true;
    default:
      return false;
    }
  };

  FakeBluetoothChooserStub.prototype.acceptWithResponder =
      function(message, responder) {
    var reader = new codec.MessageReader(message);
    switch (reader.messageName) {
    case kFakeBluetoothChooser_SetServerClient_Name:
      var params = reader.decodeStruct(FakeBluetoothChooser_SetServerClient_Params);
      this.setServerClient(params.client).then(function(response) {
        var responseParams =
            new FakeBluetoothChooser_SetServerClient_ResponseParams();
        var builder = new codec.MessageV2Builder(
            kFakeBluetoothChooser_SetServerClient_Name,
            codec.align(FakeBluetoothChooser_SetServerClient_ResponseParams
                .encodedSize),
            codec.kMessageIsResponse, reader.requestID);
        builder.setPayload(FakeBluetoothChooser_SetServerClient_ResponseParams,
                             responseParams);
        var message = builder.finish();
        responder.accept(message);
      });
      return true;
    case kFakeBluetoothChooser_Rescan_Name:
      var params = reader.decodeStruct(FakeBluetoothChooser_Rescan_Params);
      this.rescan().then(function(response) {
        var responseParams =
            new FakeBluetoothChooser_Rescan_ResponseParams();
        var builder = new codec.MessageV1Builder(
            kFakeBluetoothChooser_Rescan_Name,
            codec.align(FakeBluetoothChooser_Rescan_ResponseParams.encodedSize),
            codec.kMessageIsResponse, reader.requestID);
        builder.encodeStruct(FakeBluetoothChooser_Rescan_ResponseParams,
                             responseParams);
        var message = builder.finish();
        responder.accept(message);
      });
      return true;
    default:
      return false;
    }
  };

  function validateFakeBluetoothChooserRequest(messageValidator) {
    var message = messageValidator.message;
    var paramsClass = null;
    switch (message.getName()) {
      case kFakeBluetoothChooser_SetServerClient_Name:
        if (message.expectsResponse())
          paramsClass = FakeBluetoothChooser_SetServerClient_Params;
      break;
      case kFakeBluetoothChooser_SelectPeripheral_Name:
        if (!message.expectsResponse() && !message.isResponse())
          paramsClass = FakeBluetoothChooser_SelectPeripheral_Params;
      break;
      case kFakeBluetoothChooser_Cancel_Name:
        if (!message.expectsResponse() && !message.isResponse())
          paramsClass = FakeBluetoothChooser_Cancel_Params;
      break;
      case kFakeBluetoothChooser_Rescan_Name:
        if (message.expectsResponse())
          paramsClass = FakeBluetoothChooser_Rescan_Params;
      break;
    }
    if (paramsClass === null)
      return validator.validationError.NONE;
    return paramsClass.validate(messageValidator, messageValidator.message.getHeaderNumBytes());
  }

  function validateFakeBluetoothChooserResponse(messageValidator) {
   var message = messageValidator.message;
   var paramsClass = null;
   switch (message.getName()) {
      case kFakeBluetoothChooser_SetServerClient_Name:
        if (message.isResponse())
          paramsClass = FakeBluetoothChooser_SetServerClient_ResponseParams;
        break;
      case kFakeBluetoothChooser_Rescan_Name:
        if (message.isResponse())
          paramsClass = FakeBluetoothChooser_Rescan_ResponseParams;
        break;
    }
    if (paramsClass === null)
      return validator.validationError.NONE;
    return paramsClass.validate(messageValidator, messageValidator.message.getHeaderNumBytes());
  }

  var FakeBluetoothChooser = {
    name: 'content::mojom::FakeBluetoothChooser',
    kVersion: 0,
    ptrClass: FakeBluetoothChooserPtr,
    proxyClass: FakeBluetoothChooserProxy,
    stubClass: FakeBluetoothChooserStub,
    validateRequest: validateFakeBluetoothChooserRequest,
    validateResponse: validateFakeBluetoothChooserResponse,
  };
  FakeBluetoothChooserStub.prototype.validator = validateFakeBluetoothChooserRequest;
  FakeBluetoothChooserProxy.prototype.validator = validateFakeBluetoothChooserResponse;
  var kFakeBluetoothChooserServerClient_SendEvent_Name = 1122485303;

  function FakeBluetoothChooserServerClientPtr(handleOrPtrInfo) {
    this.ptr = new bindings.InterfacePtrController(FakeBluetoothChooserServerClient,
                                                   handleOrPtrInfo);
  }

  function FakeBluetoothChooserServerClientAssociatedPtr(associatedInterfacePtrInfo) {
    this.ptr = new associatedBindings.AssociatedInterfacePtrController(
        FakeBluetoothChooserServerClient, associatedInterfacePtrInfo);
  }

  FakeBluetoothChooserServerClientAssociatedPtr.prototype =
      Object.create(FakeBluetoothChooserServerClientPtr.prototype);
  FakeBluetoothChooserServerClientAssociatedPtr.prototype.constructor =
      FakeBluetoothChooserServerClientAssociatedPtr;

  function FakeBluetoothChooserServerClientProxy(receiver) {
    this.receiver_ = receiver;
  }
  FakeBluetoothChooserServerClientPtr.prototype.sendEvent = function() {
    return FakeBluetoothChooserServerClientProxy.prototype.sendEvent
        .apply(this.ptr.getProxy(), arguments);
  };

  FakeBluetoothChooserServerClientProxy.prototype.sendEvent = function(event) {
    var params = new FakeBluetoothChooserServerClient_SendEvent_Params();
    params.event = event;
    var builder = new codec.MessageV0Builder(
        kFakeBluetoothChooserServerClient_SendEvent_Name,
        codec.align(FakeBluetoothChooserServerClient_SendEvent_Params.encodedSize));
    builder.encodeStruct(FakeBluetoothChooserServerClient_SendEvent_Params, params);
    var message = builder.finish();
    this.receiver_.accept(message);
  };

  function FakeBluetoothChooserServerClientStub(delegate) {
    this.delegate_ = delegate;
  }
  FakeBluetoothChooserServerClientStub.prototype.sendEvent = function(event) {
    return this.delegate_ && this.delegate_.sendEvent && this.delegate_.sendEvent(event);
  }

  FakeBluetoothChooserServerClientStub.prototype.accept = function(message) {
    var reader = new codec.MessageReader(message);
    switch (reader.messageName) {
    case kFakeBluetoothChooserServerClient_SendEvent_Name:
      var params = reader.decodeStruct(FakeBluetoothChooserServerClient_SendEvent_Params);
      this.sendEvent(params.event);
      return true;
    default:
      return false;
    }
  };

  FakeBluetoothChooserServerClientStub.prototype.acceptWithResponder =
      function(message, responder) {
    var reader = new codec.MessageReader(message);
    switch (reader.messageName) {
    default:
      return false;
    }
  };

  function validateFakeBluetoothChooserServerClientRequest(messageValidator) {
    var message = messageValidator.message;
    var paramsClass = null;
    switch (message.getName()) {
      case kFakeBluetoothChooserServerClient_SendEvent_Name:
        if (!message.expectsResponse() && !message.isResponse())
          paramsClass = FakeBluetoothChooserServerClient_SendEvent_Params;
      break;
    }
    if (paramsClass === null)
      return validator.validationError.NONE;
    return paramsClass.validate(messageValidator, messageValidator.message.getHeaderNumBytes());
  }

  function validateFakeBluetoothChooserServerClientResponse(messageValidator) {
    return validator.validationError.NONE;
  }

  var FakeBluetoothChooserServerClient = {
    name: 'content::mojom::FakeBluetoothChooserServerClient',
    kVersion: 0,
    ptrClass: FakeBluetoothChooserServerClientPtr,
    proxyClass: FakeBluetoothChooserServerClientProxy,
    stubClass: FakeBluetoothChooserServerClientStub,
    validateRequest: validateFakeBluetoothChooserServerClientRequest,
    validateResponse: null,
  };
  FakeBluetoothChooserServerClientStub.prototype.validator = validateFakeBluetoothChooserServerClientRequest;
  FakeBluetoothChooserServerClientProxy.prototype.validator = null;
  exports.ChooserEventType = ChooserEventType;
  exports.FakeBluetoothChooserEvent = FakeBluetoothChooserEvent;
  exports.FakeBluetoothChooser = FakeBluetoothChooser;
  exports.FakeBluetoothChooserPtr = FakeBluetoothChooserPtr;
  exports.FakeBluetoothChooserAssociatedPtr = FakeBluetoothChooserAssociatedPtr;
  exports.FakeBluetoothChooserServerClient = FakeBluetoothChooserServerClient;
  exports.FakeBluetoothChooserServerClientPtr = FakeBluetoothChooserServerClientPtr;
  exports.FakeBluetoothChooserServerClientAssociatedPtr = FakeBluetoothChooserServerClientAssociatedPtr;
})();