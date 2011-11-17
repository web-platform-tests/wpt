/*
Distributed under both the W3C Test Suite License [1] and the W3C
3-clause BSD License [2]. To contribute to a W3C Test Suite, see the
policies and contribution forms [3].

[1] http://www.w3.org/Consortium/Legal/2008/04-testsuite-license
[2] http://www.w3.org/Consortium/Legal/2008/03-bsd-license
[3] http://www.w3.org/2004/10/27-testcases
*/

/*
 * This file automatically generates browser tests for WebIDL interfaces, using
 * the testharness.js framework.  To use, first include the following:
 *
 *   <script src=/resources/testharnessreport.js></script>
 *   <script src=/resources/testharness.js></script>
 *   <script src=/resources/WebIDLParser.js></script>
 *   <script src=/resources/idlharness.js></script>
 *
 * Then you'll need some type of IDLs.  Here's some script that can be run on a
 * spec written in HTML, which will grab all the elements with class="idl",
 * concatenate them, and replace the body so you can copy-paste:
 *
     var s = "";
     [].forEach.call(document.getElementsByClassName("idl"), function(idl) {
       s += idl.textContent + "\n\n"
     });
     document.body.innerHTML = '<pre></pre>';
     document.body.firstChild.textContent = s;
 *
 * (TODO: write this in Python or something so that it can be done from the
 * command line instead.)
 *
 * Once you have that, put it in your script somehow.  The easiest way is to
 * embed it literally in an HTML file with <script type=text/plain> or similar,
 * so that you don't have to do any escaping.  Another possibility is to put it
 * in a separate .idl file that's fetched via XHR or similar.  Once you have
 * it, run
 *
 *   var idl_array = new IdlArray(my_idls);
 *
 * where my_idls is your string.  This will throw if there are parse errors or
 * unrecognized declaration types.  (TODO: allow importing additional IDL
 * blocks that will be used when testing inheritance, but won't be tested
 * themselves.  Needed for pretty much all specs except DOM4.)
 *
 * Optionally, you can provide lists of objects that are supposed to implement
 * interfaces defined by the IDLs, like so:
 *
 *   idl_array.add_objects({
 *     Event: ['document.createEvent("Event")'],
 *     Text: ['document.createTextNode("")', 'document.querySelector("p").firstChild'],
 *   });
 *
 * The keys are interface names, and the values are lists of strings that
 * evaluate to objects.  The strings will (naturally) be evaluated in the scope
 * of the called function, so don't use local variables.  (TODO: maybe this
 * should be rethought.)  The given interface needs to be the *primary*
 * interface of the object -- for instance, don't pass Document: ['document'],
 * but rather HTMLDocument: ['document'].  Non-primary interfaces will be
 * evaluated automatically if possible.  If a non-primary interface isn't
 * recognized (wasn't passed to the constructor), test() will throw, so make
 * sure the IDL block you pass to the constructor contains every interface's
 * parent.
 *
 * Now simply run idl_array.test().  This will go through all the provided IDL
 * declarations, test various things about each, and test various further
 * things about each provided object.  The exact collection of things to be
 * tested will expand over time.  Methods on provided objects will be called
 * and properties on them will be accessed in manners that WebIDL specifies
 * must be safe, such as calling a method with too few arguments (which must
 * throw an exception and do nothing else).  If there are implementation bugs,
 * these accesses might not actually be safe and might cause side effects, so
 * be careful what objects you pass.
 *
 * TODO: Partial interface support is essential.
 */
"use strict";
(function(){
/// IdlArray ///
//@{
//Entry point
window.IdlArray = function(raw_idls)
{
    this.members = {};
    this.objects = {};
    WebIDLParser.parse(raw_idls).forEach(function(parsed_idl)
    {
        if (parsed_idl.name in this.members)
        {
            throw "Duplicate identifier " + parsed_idl.name;
        }
        switch(parsed_idl.type)
        {
        case "interface":
            this.members[parsed_idl.name] = new IdlInterface(parsed_idl);
            break;

        case "exception":
            this.members[parsed_idl.name] = new IdlException(parsed_idl);
            break;

        case "dictionary":
            //Nothing to test
            break;

        default:
            throw parsed_idl.name + ": " + parsed_idl.type + " not yet supported";
        }
    }.bind(this));
};

IdlArray.prototype.add_objects = function(dict)
{
    for (var k in dict)
    {
        if (k in this.objects)
        {
            this.objects[k].push(dict[k]);
        }
        else
        {
            this.objects[k] = dict[k];
        }
    }
};

IdlArray.prototype.test = function()
{
    for (var name in this.members)
    {
        this.members[name].test();
        if (name in this.objects)
        {
            this.objects[name].forEach(function(str)
            {
                this.members[name].test_primary_interface_of(str);
                var current_interface_name = name;
                while (current_interface_name)
                {
                    if (!(current_interface_name in this.members))
                    {
                        throw "Interface " + current_interface_name + " not found (inherited by " + name + ")";
                    }
                    this.members[current_interface_name].test_interface_of(str);
                    current_interface_name = this.members[current_interface_name].inheritance[0];
                }
            }.bind(this));
        }
    }
};
//@}

/// IdlException ///
//@{
//TODO
function IdlException(obj)
{
    this.name = obj.name;
}

IdlException.prototype.test = function()
{
}
//@}

/// IdlInterface ///
//@{
function IdlInterface(obj)
{
    this.name = obj.name;
    this.extAttrs = obj.extAttrs ? obj.extAttrs : [];
    this.members = obj.members ? obj.members.map(function(m){return new IdlInterfaceMember(m)}) : [];
    this.inheritance = obj.inheritance ? obj.inheritance : [];
}

IdlInterface.prototype.has_extended_attribute = function(name)
{
    return this.extAttrs.some(function(o)
    {
        return o.name == "name";
    });
};

IdlInterface.prototype.test = function()
{
    //TODO: Test constructors, probably lots of other stuff

    if (this.has_extended_attribute("NoInterfaceObject"))
    {
        //No tests to do without an instance
        return;
    }

    test(function()
    {
        //"For every interface that is not declared with the
        //[NoInterfaceObject] extended attribute, a corresponding property
        //must exist on the interface’s relevant namespace object. The name
        //of the property is the identifier of the interface, and its value
        //is an object called the interface object. The property has the
        //attributes { [[Writable]]: true, [[Enumerable]]: false,
        //[[Configurable]]: true }."
        //TODO: Should we test here that the property is actually writable
        //etc., or trust getOwnPropertyDescriptor?
        assert_own_property(window, this.name,
                            "window does not have own property " + format_value(this.name));
        assert_true(Object.getOwnPropertyDescriptor(window, this.name).writable,
                    "window's property " + format_value(this.name) + " is not writable");
        assert_false(Object.getOwnPropertyDescriptor(window, this.name).enumerable,
                     "window's property " + format_value(this.name) + " is enumerable");
        assert_true(Object.getOwnPropertyDescriptor(window, this.name).configurable,
                    "window's property " + format_value(this.name) + " is not configurable");

        //"Interface objects are always function objects."
        //"If an object is defined to be a function object, then it has
        //characteristics as follows:"
        //"Its [[Prototype]] internal property is the Function prototype
        //object."
        //FIXME: The spec is wrong, has to be Object.prototype and not
        //Function.prototype.  I test for how browsers actually behave,
        //assuming the bug will be fixed:
        //http://www.w3.org/Bugs/Public/show_bug.cgi?id=14813
        assert_true(Object.prototype.isPrototypeOf(window[this.name]),
                    "prototype of window's property " + format_value(this.name) + " is not Object.prototype");
        //"Its [[Get]] internal property is set as described in ECMA-262
        //section 15.3.5.4."
        //"Its [[Construct]] internal property is set as described in ECMA-262
        //section 13.2.2."
        //TODO: I'm not sure how to test these.
        //"Its [[HasInstance]] internal property is set as described in
        //ECMA-262 section 15.3.5.3, unless otherwise specified."
        //This needs to be tested in some other assertion that takes an object
        //that's supposed to be an instance of the interface.

        //"The [[Class]] property of the interface object must be the
        //identifier of the interface."
        assert_equals(String(window[this.name]), "[object " + this.name + "]",
                      "String(" + this.name + ")");
    }.bind(this), this.name + " interface: existence and properties of interface object");

    test(function()
    {
        assert_own_property(window, this.name,
                            "window does not have own property " + format_value(this.name));

        //"The interface object must also have a property named “prototype”
        //with attributes { [[Writable]]: false, [[Enumerable]]: false,
        //[[Configurable]]: false } whose value is an object called the
        //interface prototype object. This object has properties that
        //correspond to the attributes and operations defined on the interface,
        //and is described in more detail in section 4.5.3 below."
        assert_own_property(window[this.name], "prototype",
                            'interface "' + this.name + '" does not have own property "prototype"');
        var desc = Object.getOwnPropertyDescriptor(window[this.name], "prototype");
        assert_false(desc.writable, this.name + ".prototype is writable");
        assert_false(desc.enumerable, this.name + ".prototype is enumerable");
        assert_false(desc.configurable, this.name + ".prototype is configurable");

        //"The interface prototype object for a given interface A must have
        //an internal [[Prototype]] property whose value is as follows:
        //"If A is not declared to inherit from another interface, then the
        //value of the internal [[Prototype]] property of A is the Array
        //prototype object ([ECMA-262], section 15.4.4) if the interface
        //was declared with ArrayClass, or the Object prototype object
        //otherwise ([ECMA-262], section 15.2.4).
        //"Otherwise, A does inherit from another interface. The value of
        //the internal [[Prototype]] property of A is the interface
        //prototype object for the inherited interface."
        var inherit_interface;
        if (this.inheritance.length)
        {
            inherit_interface = this.inheritance[0];
        }
        else if (this.has_extended_attribute("ArrayClass"))
        {
            inherit_interface = "Array";
        }
        else
        {
            inherit_interface = "Object";
        }
        assert_own_property(window, inherit_interface,
                            'should inherit from ' + inherit_interface + ', but window has no such property');
        assert_own_property(window[inherit_interface], "prototype",
                            'should inherit from ' + inherit_interface + ', but that object has no "prototype" property');
        assert_true(window[inherit_interface].prototype.isPrototypeOf(window[this.name].prototype),
                    'prototype of ' + this.name + '.prototype is not ' + inherit_interface + '.prototype');
    }.bind(this), this.name + " interface: existence and properties of interface prototype object");

    test(function()
    {
        assert_own_property(window, this.name,
                            "window does not have own property " + format_value(this.name));
        assert_own_property(window[this.name], "prototype",
                            'interface "' + this.name + '" does not have own property "prototype"');

        //"If the [NoInterfaceObject] extended attribute was not specified on
        //the interface, then the interface prototype object must also have a
        //property named “constructor” with attributes { [[Writable]]: true,
        //[[Enumerable]]: false, [[Configurable]]: true } whose value is a
        //reference to the interface object for the interface."
        assert_own_property(window[this.name].prototype, "constructor",
                            this.name + '.prototype does not have own property "constructor"');
        assert_true(Object.getOwnPropertyDescriptor(window[this.name].prototype, "constructor").writable,
                    this.name + ".prototype.constructor is not writable");
        assert_false(Object.getOwnPropertyDescriptor(window[this.name].prototype, "constructor").enumerable,
                     this.name + ".prototype.constructor is enumerable");
        assert_true(Object.getOwnPropertyDescriptor(window[this.name].prototype, "constructor").configurable,
                    this.name + ".prototype.constructor in not configurable");
        assert_equals(window[this.name].prototype.constructor, window[this.name],
                      this.name + '.prototype.constructor is not the same object as ' + this.name);
    }.bind(this), this.name + " interface: existence and properties of interface prototype's object constructor member");

    for (var i = 0; i < this.members.length; i++)
    {
        var member = this.members[i];
        if (member.type == "const")
        {
            test(function()
            {
                assert_own_property(window, this.name,
                                    "window does not have own property " + format_value(this.name));

                //"For each constant defined on an interface A, there must
                //be a corresponding property on the interface object, if
                //it exists."
                assert_own_property(window[this.name], member.name);
                //"The value of the property is that which is obtained by
                //converting the constant’s IDL value to an ECMAScript
                //value."
                assert_equals(window[this.name][member.name], eval(member.value),
                              "property has wrong value");
                //"The property has attributes { [[Writable]]: false,
                //[[Enumerable]]: true, [[Configurable]]: false }."
                var desc = Object.getOwnPropertyDescriptor(window[this.name], member.name);
                assert_true(desc.writable, "property is not writable");
                assert_true(desc.enumerable, "property is not enumerable");
                assert_true(desc.configurable, "property is not configurable");
            }.bind(this), this.name + " interface: constant " + member.name + " on interface object");
            //"In addition, a property with the same characteristics must
            //exist on the interface prototype object."
            test(function()
            {
                assert_own_property(window, this.name,
                                    "window does not have own property " + format_value(this.name));
                assert_own_property(window[this.name], "prototype",
                                    'interface "' + this.name + '" does not have own property "prototype"');

                assert_own_property(window[this.name].prototype, member.name);
                assert_equals(window[this.name].prototype[member.name], eval(member.value),
                              "property has wrong value");
                var desc = Object.getOwnPropertyDescriptor(window[this.name], member.name);
                assert_true(desc.writable, "property is not writable");
                assert_true(desc.enumerable, "property is not enumerable");
                assert_true(desc.configurable, "property is not configurable");
            }.bind(this), this.name + " interface: constant " + member.name + " on interface prototype object");
        }
        else if (member.type == "attribute")
        {
            test(function()
            {
                assert_own_property(window, this.name,
                                    "window does not have own property " + format_value(this.name));
                assert_own_property(window[this.name], "prototype",
                                    'interface "' + this.name + '" does not have own property "prototype"');

                //"For each attribute defined on the interface, there must
                //exist a corresponding property. If the attribute was
                //declared with the [Unforgeable] extended attribute, then
                //the property exists on every object that implements the
                //interface.  Otherwise, it exists on the interface’s
                //interface prototype object."
                if (!member.has_extended_attribute("Unforgeable"))
                {
                    assert_own_property(window[this.name].prototype, member.name);
                }

                //"The property has attributes { [[Get]]: G, [[Set]]: S,
                //[[Enumerable]]: true, [[Configurable]]: configurable },
                //where:
                //"configurable is false if the attribute was declared with
                //the [Unforgeable] extended attribute and true otherwise;
                //"G is the attribute getter, defined below; and
                //"S is the attribute setter, also defined below."
                var desc = Object.getOwnPropertyDescriptor(window[this.name].prototype, member.name);
                assert_true(desc.enumerable, "property is not enumerable");
                if (member.has_extended_attribute("Unforgeable"))
                {
                    assert_false(desc.configurable, "[Unforgeable] property must not be configurable");
                }
                else
                {
                    assert_true(desc.configurable, "property must be configurable");
                }
                //"The attribute getter is a Function object whose behavior
                //when invoked is as follows:
                //"...
                //"The value of the Function object’s “length” property is
                //the Number value 0."
                assert_equals(typeof desc.get, "function", "getter must be Function");
                assert_equals(desc.get.length, 0, "getter length must be 0");
                //"The attribute setter is undefined if the attribute is
                //declared readonly and has neither a [PutForwards] nor a
                //[Replaceable] extended attribute declared on it.
                //Otherwise, it is a Function object whose behavior when
                //invoked is as follows:
                //"...
                //"The value of the Function object’s “length” property is
                //the Number value 1."
                if (member.readonly
                && !member.has_extended_attribute("PutForwards")
                && !member.has_extended_attribute("Replaceable"))
                {
                    assert_equals(desc.set, undefined, "setter must be undefined for readonly attributes");
                }
                else
                {
                    assert_equals(typeof desc.set, "function", "setter must be function for PutForwards, Replaceable, or non-readonly attributes");
                    assert_equals(desc.set.length, 1, "setter length must be 1");
                }
            }.bind(this), this.name + " interface: attribute " + member.name);
        }
        else if (member.type == "operation")
        {
            //TODO: Need to correctly handle multiple operations with the
            //same identifier.
            if (!member.name)
            {
                //Unnamed getter or such
                continue;
            }
            test(function()
            {
                assert_own_property(window, this.name,
                                    "window does not have own property " + format_value(this.name));
                assert_own_property(window[this.name], "prototype",
                                    'interface "' + this.name + '" does not have own property "prototype"');

                //"For each unique identifier of an operation defined on
                //the interface, there must be a corresponding property on
                //the interface prototype object (if it is a regular
                //operation) or the interface object (if it is a static
                //operation), unless the effective overload set for that
                //identifier and operation and with an argument count of 0
                //(for the ECMAScript language binding) has no entries."
                //TODO: The library doesn't seem to support static
                //operations.
                assert_own_property(window[this.name].prototype, member.name,
                    "interface prototype object missing non-static operation");

                var desc = Object.getOwnPropertyDescriptor(window[this.name].prototype, member.name);
                //"The property has attributes { [[Writable]]: true,
                //[[Enumerable]]: true, [[Configurable]]: true }."
                assert_true(desc.writable, "property must be writable");
                assert_true(desc.enumerable, "property must be enumerable");
                assert_true(desc.configurable, "property must be configurable");
                //"The value of the property is a Function object whose
                //behavior is as follows . . ."
                assert_equals(typeof window[this.name].prototype[member.name], "function",
                              "property must be a function");
                //"The value of the Function object’s “length” property is
                //a Number determined as follows:
                //". . .
                //"Return the maximum argument list length of the functions
                //in the entries of S."
                assert_equals(window[this.name].prototype[member.name].length, member.arguments.length,
                    "property has wrong .length");
            }.bind(this), this.name + " interface: operation " + member.name);
        }
    }
}

IdlInterface.prototype.test_primary_interface_of = function(desc)
{
    var obj, exception = null;
    try
    {
        obj = eval(desc);
    }
    catch(e)
    {
        exception = e;
    }

    var interface_name = this.name;

    if (!this.has_extended_attribute("NoInterfaceObject"))
    {
        test(function()
        {
            assert_own_property(window, interface_name,
                                "window does not have own property " + format_value(interface_name));
            assert_own_property(window[interface_name], "prototype",
                                'interface "' + interface_name + '" does not have own property "prototype"');
            assert_equals(exception, null, "Unexpected exception when evaluating object");
            assert_equals(typeof obj, "object", "provided value is not an object");

            //"The value of the internal [[Prototype]] property of the platform
            //object is the interface prototype object of the primary interface
            //from the platform object’s associated global environment."
            assert_true(window[interface_name].prototype.isPrototypeOf(obj),
                desc + "'s prototype is not " + interface_name + ".prototype");

        }.bind(this), interface_name + " must be primary interface of " + desc);
    }

    //TODO: "The value of the internal [[Class]] property of a platform object
    //that implements one or more interfaces must be the identifier of the
    //primary interface of the platform object."
};

IdlInterface.prototype.test_interface_of = function(desc)
{
    var obj, exception = null;
    try
    {
        obj = eval(desc);
    }
    catch(e)
    {
        exception = e;
    }

    //TODO: Indexed and named properties, more checks on interface members

    for (var i = 0; i < this.members.length; i++)
    {
        var member = this.members[i];
        if (member.has_extended_attribute("Unforgeable"))
        {
            test(function()
            {
                assert_equals(exception, null, "Unexpected exception when evaluating object");
                assert_own_property(obj, member.name);
            }.bind(this), this.name + " interface: " + desc + ' must have own property "' + member.name + '"');
        }
        else if ((member.type == "const"
        || member.type == "attribute"
        || member.type == "operation")
        && member.name)
        {
            test(function()
            {
                assert_equals(exception, null, "Unexpected exception when evaluating object");
                assert_inherits(obj, member.name);
                if (member.type == "operation")
                {
                    assert_equals(typeof obj[member.name], "function");
                }
                else if (member.type == "const" || member.type == "attribute")
                {
                    var expected_type = idl_typeof(member.idlType.idlType);
                    if ((!member.idlType.nullable || obj[member.name] !== null) && expected_type)
                    {
                        assert_equals(typeof obj[member.name], idl_typeof(member.idlType.idlType));
                    }
                }
            }.bind(this), this.name + " interface: " + desc + ' must inherit property "' + member.name + '" with the proper type');
        }
        //TODO: This is wrong if there are multiple operations with the same
        //identifier.
        //TODO: Test passing arguments of the wrong type.
        if (member.type == "operation" && member.name && member.arguments.length)
        {
            test(function()
            {
                assert_equals(exception, null, "Unexpected exception when evaluating object");
                assert_inherits(obj, member.name);
                var args = [];
                for (var i = 0; i < member.arguments.length; i++)
                {
                    if (member.arguments[i].optional)
                    {
                        break;
                    }
                    assert_throws(new TypeError(), function()
                    {
                        obj[member.name].call(obj, args);
                    }, "Called with " + i + " arguments");

                    args.push(create_suitable_object(member.arguments[i].type));
                }
            }.bind(this), this.name + " interface: calling " + member.name + "() on " + desc + " with too few arguments must throw TypeError");
        }
    }
}
//@}

/// IdlInterfaceMember ///
//@{
function IdlInterfaceMember(obj)
{
    for (var k in obj)
    {
        if (k == "extAttrs")
        {
            this.extAttrs = obj.extAttrs ? obj.extAttrs : [];
        }
        else
        {
            this[k] = obj[k];
        }
    }
    if (!("extAttrs" in this))
    {
        this.extAttrs = [];
    }
}

IdlInterfaceMember.prototype.has_extended_attribute = function(name)
{
    return this.extAttrs.some(function(o)
    {
        return o.name == "name";
    });
};
//@}

/// Internal helper functions ///
//@{
function idl_typeof(idl_type)
{
    switch (idl_type)
    {
        case "boolean":
            return "boolean";

        case "byte": case "octet": case "short": case "unsigned short":
        case "long": case "unsigned long": case "long long":
        case "unsigned long long": case "float": case "double":
            return "number";

        case "DOMString":
            return "string";

        case "object":
            return "object";
    }
    return undefined;
}

function create_suitable_object(type)
{
    if (type.nullable)
    {
        return null;
    }
    switch (type.idlType)
    {
        case "any":
        case "boolean":
            return true;

        case "byte": case "octet": case "short": case "unsigned short":
        case "long": case "unsigned long": case "long long":
        case "unsigned long long": case "float": case "double":
            return 7;

        case "DOMString":
            return "foo";

        case "object":
            return {a: "b"};

        case "Node":
            return document.createTextNode("abc");
    }
    return null;
}
//@}
})();
// vim: set expandtab shiftwidth=4 tabstop=4 foldmarker=@{,@} foldmethod=marker:
