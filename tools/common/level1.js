// DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER
//  
// Copyright (C) 2014, Cable Television Laboratories, Inc. & Skynav, Inc. 
//  
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice, this list
//   of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice, this list
//   of conditions and the following disclaimer in the documentation and/or other
//   materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
// PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"use strict";
(function() {
    var global = window;
    function level1(spec, defs, getInstance) {
        testDefinitions(spec, defs, getInstance, false);
    }
    function level1Async(spec, defs, getInstance) {
        testDefinitions(spec, defs, getInstance, true);
    }
    function testDefinitions(spec, defs, getInstance, async) {
        var def = !!defs && !Array.isArray(defs) ? defs : ((defs.length > 0) ? defs[0] : null);
        if (!!def) {
            if (def.type == 'callback interface')
                testInterface(spec, def, getInstance, async);
            else if (def.type == 'exception')
                testException(spec, def, getInstance, async);
            else if (def.type == 'implements')
                testImplements(spec, findInterface(defs, def.implements), getInstance, async, def.target);
            else if (def.type == 'interface')
                testInterface(spec, def, getInstance, async);
        }
    }
    function testException(spec, def, getInstance, async) {
        testInterface(spec, def, getInstance, async);
    }
    function testImplements(spec, def, getInstance, async, target) {
        testInterface(spec, def, getInstance, async, target);
    }
    function testInterface(spec, def, getInstance, async, target) {
        var defType = def.type || 'definition';
        var defName = def.name || 'missing';
        var defProperties = {
            idl: def,
            type: defType,
            name: defName,
            expandedName: makeExpandedName(spec, def, target)
        };
        test(function() {
            assert_true(!!def, 'Is IDL defined?');
        }, defProperties.expandedName + '-idl-defined');
        if (!def)
            return;
        if (!hasExtendedAttribute(def, 'NoInterfaceObject')) {
            test(function() {
                assert_true(defName in global, 'Is ' + defProperties.name + ' bound at global scope?');
            }, defProperties.expandedName + '-bound-at-global-scope');
            if (defName in global) {
                test(function() {
                    assert_true(!!global[defName], 'Is ' + defProperties.name + ' interface object present?');
                }, defProperties.expandedName + '-interface-object-present');
            }
        }
        var interfaceInstance = defName in global && global[defName];
        if (!!interfaceInstance) {
            test(function() {
                assert_true('prototype' in interfaceInstance, 'Does ' + defProperties.name + ' interface object have a prototype property?');
            }, defProperties.expandedName + '-interface-object-has-prototype-property');
            if ('prototype' in interfaceInstance) {
                test(function() {
                    assert_true(!!interfaceInstance['prototype'], 'Does ' + defProperties.name + ' interface object have a prototype?');
                }, defProperties.expandedName + '-interface-object-has-prototype');
            }
            if (hasStaticMember(def)) {
                test(function() {
                    testStaticMembers(interfaceInstance, defProperties);
                }, defProperties.expandedName + '-has-statics', {def: defProperties});
            }
            if (hasConstantMember(def)) {
                test(function() {
                    testConstantMembers(interfaceInstance, defProperties);
                }, defProperties.expandedName + '-has-constants', {def: defProperties});
            }
            if (hasExtendedAttribute(def, 'Constructor') || hasExtendedAttribute(def, 'NamedConstructor')) {
                test(function() {
                    testConstructors(interfaceInstance, defProperties);
                }, defProperties.expandedName + '-has-constructors', {def: defProperties});
            }
        }
        if (!!getInstance && ((getInstance != 'undefined') && (getInstance != 'null'))) {
            if (typeof getInstance == 'function') {
                if (!async) {
                    test(function() {
                        testInstance(getInstance(), defProperties);
                    }, defProperties.expandedName + '-get-instance-sync', {def: defProperties});
                } else
                    async_test(getInstance, defProperties.expandedName + '-get-instance-async', {def: defProperties});
            }
        }
    };
    function findInterface(defs, name) {
        if (!name)
            return null;
        for (var i in defs) {
            var def = defs[i];
            if ((def.type == 'interface' || def.type == 'callback interface') && ('name' in def) && (def.name == name))
                return def;
        }
        return null;
    }
    function makeExpandedName(spec, def, target) {
        if (!!target)
            return spec + '-' + target.toLowerCase() + '-implements-' + def.name.toLowerCase();
        else
            return spec + '-' + def.type + '-' + def.name.toLowerCase();
    }
    function hasExtendedAttribute(def, attr) {
        var eas = def.extAttrs || [];
        for (var i in eas) {
            var ea = eas[i];
            if (ea.name == attr)
                return true;
        }
        return false;
    }
    function hasStaticMember(def) {
        for (var i in def.members) {
            var member = def.members[i];
            if (member.static)
                return true;
        }
        return false;
    }
    function testStaticMembers(interfaceInstance, defProperties) {
        for (var i in defProperties.idl.members) {
            var member = defProperties.idl.members[i];
            if (!member.static)
                continue;
            var memberName = member.name;
            if (!memberName)
                continue;
            var overloadIndex = getOverloadIndex(memberName);
            if (overloadIndex < 1) {
                if (member.type == 'attribute') {
                    test(function() {
                        assert_true(memberName in interfaceInstance, 'Does ' + defProperties.name + ' interface have static ' + memberName + ' attribute?');
                    }, defProperties.expandedName + '-has-static-' + memberName + '-attribute');
                } else if (member.type == 'operation') {
                    test(function() {
                        assert_true(memberName in interfaceInstance, 'Does ' + defProperties.name + ' interface have static ' + memberName + ' operation?');
                    }, defProperties.expandedName + '-has-static-' + memberName + '-operation');
                }
            }
        }
    }
    function hasConstantMember(def) {
        for (var i in def.members) {
            var member = def.members[i];
            if (member.type == 'const')
                return true;
        }
        return false;
    }
    function testConstantMembers(interfaceInstance, defProperties) {
        for (var i in defProperties.idl.members) {
            var member = defProperties.idl.members[i];
            if (member.type != 'const')
                continue;
            var memberName = member.name;
            if (!memberName)
                continue;
            test(function() {
                assert_true(memberName in interfaceInstance, 'Does ' + defProperties.name + ' interface have ' + memberName + ' constant?');
            }, defProperties.expandedName + '-has-' + memberName + '-constant');
            if (memberName in interfaceInstance) {
                var value = member.value;
                if (!!member.value) {
                    if (value.type == 'number') {
                        test(function() {
                            assert_equals(interfaceInstance[memberName], value.value, 'Does ' + memberName + ' interface constant have value ' + value.value + '?');
                        }, defProperties.expandedName + '-constant-' + memberName + '-has-value-' + value.value);
                    }
                }
            }
        }
    }
    function testConstructors(interfaceInstance, defProperties) {
        var defName = defProperties.name;
        var prototype = interfaceInstance.prototype;
        if (!prototype)
            return;
        for (var i in defProperties.idl.extAttrs) {
            var ea = defProperties.idl.extAttrs[i];
            if (ea.name == 'Constructor') {
                var constructorName = ea.name;
                var overloadIndex = getOverloadIndex(constructorName);
                if (overloadIndex > 0)
                    continue;
                test(function() {
                    assert_true('constructor' in prototype, 'Does ' + defName + ' interface prototype have a constructor property?');
                }, defProperties.expandedName + '-prototype-has-constructor-property');
                var constructor = prototype['constructor'];
                if (!!constructor) {
                    test(function() {
                        assert_true(constructor === global[defName], 'Does ' + defName + ' interface constructor strictly equal global interface object?');
                    }, defProperties.expandedName + '-constructor-strictly-equals-global-interface-object');
                    test(function() {
                        assert_equals(typeof constructor, 'function', 'Is ' + defName + ' interface constructor a function?');
                    }, defProperties.expandedName + '-constructor-is-function');
                }
            } else if (ea.name == 'NamedConstructor') {
                var constructorName = ea.rhs.value;
                var overloadIndex = getOverloadIndex(constructorName);
                if (overloadIndex > 0)
                    continue;
                test(function() {
                    assert_true(constructorName in global, 'Is ' + defName + ' named constructor ' + constructorName + ' bound at global scope?');
                }, defProperties.expandedName + '-named-constructor-' + constructorName + '-bound-at-global-scope');
                var constructor = global[constructorName];
                if (!!constructor) {
                    test(function() {
                        assert_equals(typeof constructor, 'function', 'Is ' + defName + ' named constructor ' + constructorName + ' a function?');
                    }, defProperties.expandedName + '-named-constructor-' + constructorName + '-is-function');
                    test(function() {
                        assert_true(!!constructor['prototype'], 'Does ' + defName + ' named constructor ' + constructorName + ' have a prototype?');
                    }, defProperties.expandedName + '-named-constructor-' + constructorName + '-has-prototype');
                    test(function() {
                        assert_true(constructor['prototype'] === prototype, 'Does ' + defName + ' named constructor ' + constructorName +
                            ' prototype strictly equal interface prototype?');
                    }, defProperties.expandedName + '-named-constructor-' + constructorName + '-prototype-strictly-equals-interface-prototype');
                }
            }
        }
    }
    function hasInstanceMember(def) {
        for (var i in def.members) {
            var member = def.members[i];
            if (!member.static)
                return true;
        }
        return false;
    }
    function testInstance(instance, defProperties) {
        var defName = defProperties.name;
        test(function() {
            assert_true(!!instance, 'Is ' + defName + ' instance present?');
        }, defProperties.expandedName + '-instance-present');
        if (!instance)
            return;
        if (!hasExtendedAttribute(defProperties.idl, 'NoInterfaceObject')) {
            test(function() {
                assert_true(defName in global && instance instanceof global[defName], 'Is instance object an instance of ' + defName + '?');
            }, defProperties.expandedName + '-is-instance-instanceof-' + defName);
        }
        var inheritance = defProperties.idl.inheritance;
        if (!!inheritance) {
            // TODO: the following is producing false negatives in the case that the inherited interface is marked as [NoInterfaceObject],
            // in which case we can't determine inheritance using instanceof operator; to fix this, we need a list of all IDL interfaces (defined in any spec)
            // that are marked as [NoInterfaceObject]; we will need to compute that table by indexing all parsed IDL definitions between the parse phase and the
            // generate phase
            test(function() {
                assert_true(inheritance in global && instance instanceof global[inheritance], 'Does instance object inherit from ' + inheritance + '?');
            }, defProperties.expandedName + '-does-instance-inherit-from-' + inheritance);
        }
        for (var i in defProperties.idl.members) {
            var member = defProperties.idl.members[i];
            var memberName = member.name;
            if (!memberName) {
                if (member.type == 'operation') {
                    if (member.stringifier) {
                        memberName = 'toString';
                    }
                } else if (member.type == 'serializer')
                    memberName = 'toJSON';
            }
            if (!memberName)
                continue;
            var overloadIndex = getOverloadIndex(memberName);
            if (overloadIndex < 1) {
                if (member.type == 'const') {
                    test(function() {
                        assert_true(memberName in instance, 'Does ' + defName + ' instance have ' + memberName + ' constant?');
                    }, defProperties.expandedName + '-instance-has-' + memberName + '-constant');
                    if (memberName in instance) {
                        var value = member.value;
                        if (!!member.value) {
                            if (value.type == 'number') {
                                test(function() {
                                    assert_equals(instance[memberName], value.value, 'Does ' + defName + ' instance constant have value ' + value.value + '?');
                                }, defProperties.expandedName + '-instance-' + memberName + '-constant-has-value-' + value.value);
                            }
                        }
                    }
                } else if (member.type == 'field') {
                    test(function() {
                        assert_true(memberName in instance, 'Does ' + defName + ' instance have ' + memberName + ' field?');
                    }, defProperties.expandedName + '-instance-has-' + memberName + '-field');
                } else if (member.type == 'attribute') {
                    test(function() {
                        assert_true(memberName in instance, 'Does ' + defName + ' instance have ' + memberName + ' attribute?');
                    }, defProperties.expandedName + '-instance-has-' + memberName + '-attribute');
                } else if (member.type == 'operation') {
                    test(function() {
                        assert_true(memberName in instance, 'Does ' + defName + ' instance have ' + memberName + ' operation?');
                    }, defProperties.expandedName + '-instance-has-' + memberName + '-operation');
                } else if (member.type == 'serializer') {
                    test(function() {
                        assert_true(memberName in instance, 'Does ' + defName + ' instance have ' + memberName + ' serializer?');
                    }, defProperties.expandedName + '-instance-has-' + memberName + '-serializer');
                }
            }
        }
    }
    var overloads = { names: [], counts: [] };
    function getOverloadIndex(memberName) {
        var names = overloads.names;
        var counts = overloads.counts;
        var i = names.indexOf(memberName);
        if (i < 0) {
            i = names.length;
            names[i] = memberName;
            counts[i] = 1;
        } else {
            counts[i] = counts[i] + 1;
        }
        return counts[i] - 1;
    }
    /* debug only */
    function dumpProps(o) {
        var s = '';
        for (var pn in o) {
            if (s.length > 0)
                s += ',\n';
            s += pn + ':' + o[pn];
        }
        return s;
    }
    function InstantiationError(message)
    {
        this.message = 'InstantiationError: ' + message;
    }
    InstantiationError.prototype.toString = function() {
        return this.message;
    };
    /* globalizers */
    function expose(name, value) {
        global[name] = value;
    }
    expose('expose', expose);
    expose('level1', level1);
    expose('level1Async', level1Async);
    expose('level1TestInstance', testInstance);
    expose('InstantiationError', InstantiationError);
    /* debug only */
    expose('dumpProps', dumpProps);
})();
