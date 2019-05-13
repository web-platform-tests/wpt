
# WebIDL 2

[![NPM version](https://badge.fury.io/js/webidl2.svg)](http://badge.fury.io/js/webidl2)

## Purpose

This is a parser for the [WebIDL](http://dev.w3.org/2006/webapi/WebIDL/) language. If
you don't know what that is, then you probably don't need it. It is meant to be used
both in Node and in the browser (the parser likely works in other JS environments, but
not the test suite).

## Installation

Just the usual. For Node:

```Bash
npm install webidl2
```

In the browser without module support:

```HTML
<script src='./webidl2/dist/webidl2.js'></script>
```

## Documentation

WebIDL2 provides two functions: `parse` and `write`.

* `parse`: Converts a WebIDL string into a syntax tree.
* `write`: Converts a syntax tree into a WebIDL string. Useful for programmatic code
  modification.

In Node, that happens with:

```JS
const { parse, write, validate } = require("webidl2");
const tree = parse("string of WebIDL");
const text = write(tree);
const validation = validate(tree);
```

In the browser:
```HTML
<script>
  const tree = WebIDL2.parse("string of WebIDL");
  const text = WebIDL2.write(tree);
  const validation = WebIDL2.validate(tree);
</script>

<!-- Or when module is supported -->
<script type="module">
  import { parse, write, validate } from "./webidl2/index.js";
  const tree = parse("string of WebIDL");
  const text = write(tree);
  const validation = validate(tree);
</script>
```

`write()` optionally takes a "templates" object, whose properties are functions that process input in different ways (depending on what is needed for output). Every property is optional. Each property is documented below:

```js
var result = WebIDL2.write(tree, {
  templates: {
    /**
     * A function that receives syntax strings plus anything the templates returned.
     * The items are guaranteed to be ordered.
     * The returned value may be again passed to any template functions,
     * or it may also be the final return value of `write()`.
     * @param {any[]} items
     */
    wrap: items => items.join(""),
    /**
     * @param {string} t A trivia string, which includes whitespaces and comments.
     */
    trivia: t => t,
    /**
     * The identifier for a container type. For example, the `Foo` part of `interface Foo {};`.
     * @param {string} escaped The escaped raw name of the definition.
     * @param data The definition with the name
     * @param parent The parent of the definition, undefined if absent
     */
    name: (escaped, { data, parent }) => escaped,
    /**
     * Called for each type referece, e.g. `Window`, `DOMString`, or `unsigned long`.
     * @param escaped The referenced name. Typically string, but may also be the return
     *            value of `wrap()` if the name contains whitespace.
     * @param unescaped Unescaped reference.
     */
    reference: (escaped, unescaped) => escaped,
    /**
     * Called for each generic-form syntax, e.g. `sequence`, `Promise`, or `maplike`.
     * @param {string} name The keyword for syntax
     */
    generic: name => name,
    /**
     * Called only once for each types, e.g. `Document`, `Promise<DOMString>`, or `sequence<long>`.
     * @param type The `wrap()`ed result of references and syntatic bracket strings.
     */
    type: type => type,
    /**
     * Receives the return value of `reference()`. String if it's absent.
     */
    inheritance: inh => inh,
    /**
     * Called for each IDL type definition, e.g. an interface, an operation, or a typedef.
     * @param content The wrapped value of everything the definition contains.
     * @param data The original definition object
     * @param parent The parent of the definition, undefined if absent
     */
    definition: (content, { data, parent }) => content,
    /**
     * Called for each extended attribute annotation.
     * @param content The wrapped value of everything the annotation contains.
     */
    extendedAttribute: content => content,
    /**
     * The `Foo` part of `[Foo=Whatever]`.
     * @param ref The name of the referenced extended attribute name.
     */
    extendedAttributeReference: ref => ref
  }
});
```

"Wrapped value" here will all be raw strings when the `wrap()` callback is absent.

`validate()` returns semantic errors in a string array form:

```js
const validations = validate(tree);
for (const validation of validations) {
  console.log(validation);
}
// Validation error on line X: ...
// Validation error on line Y: ...
```

### Errors

When there is a syntax error in the WebIDL, it throws an exception object with the following
properties:

* `message`: the error message
* `line`: the line at which the error occurred.
* `input`: a short peek at the text at the point where the error happened
* `tokens`: the five tokens at the point of error, as understood by the tokeniser
  (this is the same content as `input`, but seen from the tokeniser's point of view)

The exception also has a `toString()` method that hopefully should produce a decent
error message.

### AST (Abstract Syntax Tree)

The `parse()` method returns a tree object representing the parse tree of the IDL.
Comment and white space are not represented in the AST.

The root of this object is always an array of definitions (where definitions are
any of interfaces, dictionaries, callbacks, etc. — anything that can occur at the root
of the IDL).

### IDL Type

This structure is used in many other places (operation return types, argument types, etc.).
It captures a WebIDL type with a number of options. Types look like this and are typically
attached to a field called `idlType`:

```JS
{
  "type": "attribute-type",
  "generic": "",
  "idlType": "unsigned short",
  "nullable": false,
  "union": false,
  "extAttrs": {
    "items": [...]
  }
}
```

Where the fields are as follows:

* `type`: String indicating where this type is used. Can be `null` if not applicable.
* `generic`: String indicating the generic type (e.g. "Promise", "sequence").
* `idlType`: String indicating the type name, or array of subtypes if the type is
  generic or a union.
* `nullable`: `true` if the type is nullable.
* `union`: Boolean indicating whether this is a union type or not.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Trivia

Structures often have `trivia` field that represents whitespaces and comments before tokens. It gives a string if the syntatic component is made of a single token or an object with multiple string type fields.

A trivia object looks like the following example:

```JS
{
  "base": "\n",
  "name": " ",
  "...": "..."
}
```

Frequently, `base` is for type keywords, `name` is for identifiers, `open`/`close` are for brackets, and `termination` for semicolons.

### Interface

Interfaces look like this:

```JS
{
  "type": "interface",
  "name": "Animal",
  "partial": false,
  "members": [...],
  "inheritance": null,
  "extAttrs": [...]
}, {
  "type": "interface",
  "name": "Human",
  "partial": false,
  "members": [...],
  "inheritance": {
    "name": "Animal"
  },
  "extAttrs": {
    "items": [...]
  }
}
```

The fields are as follows:

* `type`: Always "interface".
* `name`: The name of the interface.
* `partial`: `true` if the type is a partial interface.
* `members`: An array of interface members (attributes, operations, etc.). Empty if there are none.
* `inheritance`: An object giving the name of an interface this one inherits from, `null` otherwise.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Interface mixins

Interfaces mixins look like this:

```JS
{
  "type": "interface mixin",
  "name": "Animal",
  "partial": false,
  "members": [...],
  "extAttrs": [...]
}, {
  "type": "interface mixin",
  "name": "Human",
  "partial": false,
  "members": [...],
  "extAttrs": {
    "items": [...]
  }
}
```

The fields are as follows:

* `type`: Always "interface mixin".
* `name`: The name of the interface mixin.
* `partial`: `true if the type is a partial interface mixin.
* `members`: An array of interface members (attributes, operations, etc.). Empty if there are none.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Namespace

Namespaces look like this:

```JS
{
  "type": "namespace",
  "name": "console",
  "partial": false,
  "members": [...],
  "extAttrs": {
    "items": [...]
  }
}
```

The fields are as follows:

* `type`: Always "namespace".
* `name`: The name of the namespace.
* `partial`: `true if the type is a partial namespace.
* `members`: An array of namespace members (attributes and operations). Empty if there are none.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Callback Interfaces

These are captured by the same structure as [Interfaces](#interface) except that
their `type` field is "callback interface". Its trivia object additionally
includes a new field `callback`.

### Callback

A callback looks like this:

```JS
{
  "type": "callback",
  "name": "AsyncOperationCallback",
  "idlType": {
    "type": "return-type",
    "generic": "",
    "nullable": false,
    "union": false,
    "idlType": "void",
    "extAttrs": null
  },
  "arguments": [...],
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "callback".
* `name`: The name of the callback.
* `idlType`: An [IDL Type](#idl-type) describing what the callback returns.
* `arguments`: A list of [arguments](#arguments), as in function paramters.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Dictionary

A dictionary looks like this:

```JS
{
  "type": "dictionary",
  "name": "PaintOptions",
  "partial": false,
  "members": [{
    "type": "field",
    "name": "fillPattern",
    "required": false,
    "idlType": {
      "type": "dictionary-type",
      "generic": "",
      "nullable": true
      "union": false,
      "idlType": "DOMString",
      "extAttrs": [...]
    },
    "extAttrs": null,
    "default": {
      "type": "string",
      "value": "black"
    }
  }],
  "inheritance": null,
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "dictionary".
* `name`: The dictionary name.
* `partial`: `true` if the type is a partial dictionary.
* `members`: An array of members (see below).
* `inheritance`: An object indicating which dictionary is being inherited from, `null` otherwise.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

All the members are fields as follows:

* `type`: Always "field".
* `name`: The name of the field.
* `required`: `true` if the field is required.
* `idlType`: An [IDL Type](#idl-type) describing what field's type.
* `extAttrs`: An [extended attributes](#extended-attributes) container.
* `default`: A [default value](#default-and-const-values), absent if there is none.

### Enum

An enum looks like this:

```JS
{
  "type": "enum",
  "name": "MealType",
  "values": [
    {
      "type": "enum-value",
      "value": "rice"
    },
    {
      "type": "enum-value",
      "value": "noodles"
    },
    {
      "type": "enum-value",
      "value": "other"
    }
  ]
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "enum".
* `name`: The enum's name.
* `values`: An array of values. The type of value is "enum-value".
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Typedef

A typedef looks like this:

```JS
{
  "type": "typedef",
  "idlType": {
    "type": "typedef-type",
    "generic": "sequence",
    "nullable": false,
    "union": false,
    "idlType": [
      {
        "type": "typedef-type",
        "generic": "",
        "nullable": false,
        "union": false,
        "idlType": "Point",
        "extAttrs": [...]
      }
    ],
    "extAttrs": [...]
  },
  "name": "PointSequence",
  "extAttrs": null
}
```


The fields are as follows:

* `type`: Always "typedef".
* `name`: The typedef's name.
* `idlType`: An [IDL Type](#idl-type) describing what typedef's type.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Includes

An includes definition looks like this:

```JS
{
  "type": "includes",
  "target": "Node",
  "includes": "EventTarget",
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "includes".
* `target`: The interface that includes an interface mixin.
* `includes`: The interface mixin that is being included by the target.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Operation Member

An operation looks like this:
```JS
{
  "type": "operation",
  "special": "",
  "body": {
    "idlType": {
      "type": "return-type",
      "generic": "",
      "nullable": false,
      "union": false,
      "idlType": "void",
      "extAttrs": null
    },
    "name": "intersection",
    "arguments": [{
      "optional": false,
      "variadic": true,
      "extAttrs": null,
      "idlType": {
        "type": "argument-type",
        "generic": "",
        "nullable": false,
        "union": false,
        "idlType": "long",
        "extAttrs": [...]
      },
      "name": "ints"
    }],
  },
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "operation".
* `special`: One of `"getter"`, `"setter"`, `"deleter"`, `"static"`, `"stringifier"`, or `null`.
* `body`: The operation body. Can be null if bodyless `stringifier`.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

The operation body fields are as follows:

* `idlType`: An [IDL Type](#idl-type) of what the operation returns.
* `name`: The name of the operation if exists.
* `arguments`: An array of [arguments](#arguments) for the operation.

### Attribute Member

An attribute member looks like this:

```JS
{
  "type": "attribute",
  "static": null,
  "stringifier": null,
  "inherit": null,
  "readonly": false,
  "idlType": {
    "type": "attribute-type",
    "generic": "",
    "nullable": false,
    "union": false,
    "idlType": "any",
    "extAttrs": [...]
  },
  "name": "regexp",
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "attribute".
* `name`: The attribute's name.
* `special`: One of `"static"`, `"stringifier"`, `"inherit"`, or `null`.
* `readonly`: `true` if the attribute is read-only.
* `idlType`: An [IDL Type](#idl-type) for the attribute.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Constant Member

A constant member looks like this:

```JS
{
  "type": "const",
  "idlType": {
    "type": "const-type",
    "generic": "",
    "nullable": false,
    "union": false,
    "idlType": "boolean",
    "extAttrs": null
  },
  "name": "DEBUG",
  "value": {
    "type": "boolean",
    "value": false
  },
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always "const".
* `idlType`: An [IDL Type](#idl-type) of the constant that represents a simple type, the type name.
* `name`: The name of the constant.
* `value`: The constant value as described by [Const Values](#default-and-const-values)
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Arguments

The arguments (e.g. for an operation) look like this:

```JS
{
  "arguments": [{
    "optional": false,
    "variadic": true
    "extAttrs": null
    "idlType": {
      "type": "argument-type",
      "generic": "",
      "nullable": false,
      "union": false,
      "idlType": "float",
      "extAttrs": [...]
    },
    "name": "ints",
  }]
}
```

The fields are as follows:

* `optional`: `true` if the argument is optional.
* `variadic`: `true` if the argument is variadic.
* `idlType`: An [IDL Type](#idl-type) describing the type of the argument.
* `name`: The argument's name.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

### Extended Attributes

Extended attribute container look like this:

```JS
{
  "extAttrs": {
    "items": [{
      "name": "TreatNullAs",
      "arguments": [...],
      "type": "extended-attribute",
      "rhs": {
        "type": "identifier",
        "value": "EmptyString"
      }
    }]
  }
}
```

The fields are as follows:

* `items`: An array of extended attributes.

Extended attributes look like this:

* `name`: The extended attribute's name.
* `arguments`: An array of [arguments](#arguments), if the extended
  attribute has a signature (e.g. `[Foo()]`) or if its right-hand side does (e.g.
  `[NamedConstructor=Name(DOMString blah)]`).
* `type`: Always `"extended-attribute"`.
* `rhs`: If there is a right-hand side, this will capture its `type` (which can be
  "identifier" or "identifier-list"), its `value`, and its preceding trivia.

### Default and Const Values

Dictionary fields and operation arguments can take default values, and constants take
values, all of which have the following fields:

* `type`: One of string, number, boolean, null, Infinity, NaN, or sequence.

For string, number, boolean, and sequence:

* `value`: The value of the given type, as a string. For sequence, the only possible value is `[]`.

For Infinity:

* `negative`: Boolean indicating whether this is negative Infinity or not.

### `iterable<>`, `maplike<>`, `setlike<>` declarations

These appear as members of interfaces that look like this:

```JS
{
  "type": "maplike", // or "iterable" / "setlike"
  "idlType": /* One or two types */ ,
  "readonly": false, // only for maplike and setlike
  "extAttrs": null
}
```

The fields are as follows:

* `type`: Always one of "iterable", "maplike" or "setlike".
* `idlType`: An array with one or more [IDL Types](#idl-type) representing the declared type arguments.
* `readonly`: `true` if the maplike or setlike is declared as read only.
* `extAttrs`: An [extended attributes](#extended-attributes) container.

## Testing

### Running

The test runs with mocha and expect.js. Normally, running `npm test` in the root directory
should be enough once you're set up.

### Browser tests

In order to test in the browser, get inside `test/web` and run `make-web-tests.js`. This
will generate a `browser-tests.html` file that you can open in a browser. As of this
writing tests pass in the latest Firefox, Chrome, Opera, and Safari. Testing on IE
and older versions will happen progressively.
