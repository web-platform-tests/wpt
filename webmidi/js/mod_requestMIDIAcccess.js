var mod_requestMIDIAccess = function(sysex, test, test_obj) {
    this.sysex=sysex;
    this.test=test;
    this.test_obj=test_obj;
    this.MIDI=null;
};

mod_requestMIDIAccess.prototype = {
    run_test: function() {
        var ret=navigator.requestMIDIAccess({sysex:this.sysex}).then( successCallback, errorCallback );
        // 4.1 requestMIDIAccess() (in { sysex:false })
        this.test(function(){
            assert_class_string(ret, "Promise");
        }, "4.1 Return type in {sysex:"+this.sysex+"}");
        var self=this;
        function successCallback(access) {
            self.MIDI=access;
            // 5. MIDIAccess Interface
            test_obj.step(function() {
                self.test(function(){
                    assert_class_string(self.MIDI, "MIDIAccess");
                }, "5 MIDIAccess Interface name this.test in {sysex:"+self.sysex+"}.");
                // 5.1 Attributes
                self.test(function(){
                    assert_class_string(self.MIDI.inputs, "MIDIInputMap");
                    assert_class_string(self.MIDI.outputs, "MIDIOutputMap");
                    //assert_true(typeof self.MIDI.onstatechange=="object");
                    assert_equals("boolean", typeof self.MIDI.sysexEnabled);
                    if(self.sysex==false){
                        assert_false(self.MIDI.sysexEnabled);
                    } else {
                        assert_true(self.MIDI.sysexEnabled);
                    }
                }, "5.1 MIDIAccess interface attribute type test in {sysex:"+self.sysex+"}.");
                self.test(function(){
                    assert_idl_attribute(self.MIDI, "inputs");
                    assert_idl_attribute(self.MIDI, "outputs");
                    assert_idl_attribute(self.MIDI, "onstatechange");
                    assert_idl_attribute(self.MIDI, "sysexEnabled");
                }, "5.1 MIDIAccess interface attribute name test in {sysex:"+self.sysex+"}.");
                self.test_obj.done();
            });
        }
        function errorCallback(message) {
            test_obj.step(function() {
                assert_any(assert_array_equals, message.name, ["SecurityError",  "NotSupportedError"]);
                test_obj.done();
            });
        }
    }
};
