"use strict";

import { const_data, const_value, list, unescape } from "./productions/helpers.js";
import { argumentNameKeywords, stringTypes, Tokeniser } from "./tokeniser.js";
import { Base } from "./productions/base.js";
import { Token } from "./productions/token.js";
import { Default } from "./productions/default.js";
import { Enum } from "./productions/enum.js";
import { Includes } from "./productions/includes.js";

/**
 * @param {Tokeniser} tokeniser
 */
function parseByTokens(tokeniser) {
  const source = tokeniser.source;

  const DECIMAL = "decimal";
  const INT = "integer";
  const ID = "identifier";
  const STR = "string";

  function error(str) {
    tokeniser.error(str);
  }

  function probe(type) {
    return tokeniser.probe(type);
  }

  function consume(...candidates) {
    return tokeniser.consume(...candidates);
  }

  function unconsume(position) {
    return tokeniser.unconsume(position);
  }

  function integer_type() {
    const prefix = consume("unsigned");
    const base = consume("short", "long");
    if (base) {
      const postfix = consume("long");
      return new Type({ source, tokens: { prefix, base, postfix } });
    }
    if (prefix) error("Failed to parse integer type");
  }

  function float_type() {
    const prefix = consume("unrestricted");
    const base = consume("float", "double");
    if (base) {
      return new Type({ source, tokens: { prefix, base } });
    }
    if (prefix) error("Failed to parse float type");
  }

  function primitive_type() {
    const num_type = integer_type() || float_type();
    if (num_type) return num_type;
    const base = consume("boolean", "byte", "octet");
    if (base) {
      return new Type({ source, tokens: { base } });
    }
  }

  function type_suffix(obj) {
    const nullable = consume("?");
    if (nullable) {
      obj.tokens.nullable = nullable;
    }
    if (probe("?")) error("Can't nullable more than once");
  }

  class Type extends Base {
    constructor({ source, tokens }) {
      super({ source, tokens });
      Object.defineProperty(this, "subtype", { value: [] });
      this.extAttrs = null;
    }

    get generic() {
      return "";
    }
    get nullable() {
      return !!this.tokens.nullable;
    }
    get union() {
      return false;
    }
    get idlType() {
      if (this.subtype.length) {
        return this.subtype;
      }
      // Adding prefixes/postfixes for "unrestricted float", etc.
      const name = [
        this.tokens.prefix,
        this.tokens.base,
        this.tokens.postfix
      ].filter(t => t).map(t => t.value).join(" ");
      return unescape(name);
    }
  }

  class GenericType extends Type {
    static parse(typeName) {
      const base = consume("FrozenArray", "Promise", "sequence", "record");
      if (!base) {
        return;
      }
      const ret = new GenericType({ source, tokens: { base } });
      ret.tokens.open = consume("<") || error(`No opening bracket after ${base.type}`);
      switch (base.type) {
        case "Promise": {
          if (probe("[")) error("Promise type cannot have extended attribute");
          const subtype = return_type(typeName) || error("Missing Promise subtype");
          ret.subtype.push(subtype);
          break;
        }
        case "sequence":
        case "FrozenArray": {
          const subtype = type_with_extended_attributes(typeName) || error(`Missing ${base.type} subtype`);
          ret.subtype.push(subtype);
          break;
        }
        case "record": {
          if (probe("[")) error("Record key cannot have extended attribute");
          const keyType = consume(...stringTypes) || error(`Record key must be one of: ${stringTypes.join(", ")}`);
          const keyIdlType = new Type({ source, tokens: { base: keyType }});
          keyIdlType.tokens.separator = consume(",") || error("Missing comma after record key type");
          keyIdlType.type = typeName;
          const valueType = type_with_extended_attributes(typeName) || error("Error parsing generic type record");
          ret.subtype.push(keyIdlType, valueType);
          break;
        }
      }
      if (!ret.idlType) error(`Error parsing generic type ${base.type}`);
      ret.tokens.close = consume(">") || error(`Missing closing bracket after ${base.type}`);
      return ret;
    }

    get generic() {
      return this.tokens.base.value;
    }
  }

  function single_type(typeName) {
    let ret = GenericType.parse(typeName) || primitive_type();
    if (!ret) {
      const base = consume(ID, ...stringTypes);
      if (!base) {
        return;
      }
      ret = new Type({ source, tokens: { base } });
      if (probe("<")) error(`Unsupported generic type ${base.value}`);
    }
    if (ret.generic === "Promise" && probe("?")) {
      error("Promise type cannot be nullable");
    }
    ret.type = typeName || null;
    type_suffix(ret);
    if (ret.nullable && ret.idlType === "any") error("Type `any` cannot be made nullable");
    return ret;
  }

  class UnionType extends Type {
    static parse(type) {
      const tokens = {};
      tokens.open = consume("(");
      if (!tokens.open) return;
      const ret = new UnionType({ source, tokens });
      ret.type = type || null;
      while (true) {
        const typ = type_with_extended_attributes() || error("No type after open parenthesis or 'or' in union type");
        if (typ.idlType === "any") error("Type `any` cannot be included in a union type");
        ret.subtype.push(typ);
        const or = consume("or");
        if (or) {
          typ.tokens.separator = or;
        }
        else break;
      }
      if (ret.idlType.length < 2) {
        error("At least two types are expected in a union type but found less");
      }
      tokens.close = consume(")") || error("Unterminated union type");
      type_suffix(ret);
      return ret;
    }

    get union() {
      return true;
    }
  }

  function type(typeName) {
    return single_type(typeName) || UnionType.parse(typeName);
  }

  function type_with_extended_attributes(typeName) {
    const extAttrs = ExtendedAttributes.parse();
    const ret = type(typeName);
    if (ret) ret.extAttrs = extAttrs;
    return ret;
  }

  class Argument extends Base {
    static parse() {
      const start_position = tokeniser.position;
      const tokens = {};
      const ret = new Argument({ source, tokens });
      tokens.optional = consume("optional");
      ret.idlType = type_with_extended_attributes("argument-type");
      if (!ret.idlType) {
        return unconsume(start_position);
      }
      if (!tokens.optional) {
        tokens.variadic = consume("...");
      }
      tokens.name = consume(ID, ...argumentNameKeywords);
      if (!tokens.name) {
        return unconsume(start_position);
      }
      ret.default = tokens.optional ? Default.parse(tokeniser) : null;
      return ret;
    }

    get optional() {
      return !!this.tokens.optional;
    }
    get variadic() {
      return !!this.tokens.variadic;
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
  }

  function argument_list() {
    return list(tokeniser, { parser: Argument.parse, listName: "arguments list" });
  }

  function identifiers() {
    const ids = list(tokeniser, { parser: Token.parser(tokeniser, ID), listName: "identifier list" });
    if (!ids.length) {
      error("Expected identifiers but none found");
    }
    return ids;
  }

  class ExtendedAttributeParameters extends Base {
    static parse() {
      const tokens = { assign: consume("=") };
      const ret = new ExtendedAttributeParameters({ source, tokens });
      if (tokens.assign) {
        tokens.secondaryName = consume(ID, DECIMAL, INT, STR);
      }
      tokens.open = consume("(");
      if (tokens.open) {
        ret.list = ret.rhsType === "identifier-list" ?
          // [Exposed=(Window,Worker)]
          identifiers() :
          // [NamedConstructor=Audio(DOMString src)] or [Constructor(DOMString str)]
          argument_list();
        tokens.close = consume(")") || error("Unexpected token in extended attribute argument list");
      } else if (ret.hasRhs && !tokens.secondaryName) {
        error("No right hand side to extended attribute assignment");
      }
      return ret;
    }

    get rhsType() {
      return !this.tokens.assign ? null :
        !this.tokens.secondaryName ? "identifier-list" :
        this.tokens.secondaryName.type;
    }
  }

  class SimpleExtendedAttribute extends Base {
    static parse() {
      const name = consume(ID);
      if (name) {
        return new SimpleExtendedAttribute({
          tokens: { name },
          params: ExtendedAttributeParameters.parse()
        });
      }
    }

    constructor({ source, tokens, params }) {
      super({ source, tokens });
      Object.defineProperty(this, "params", { value: params });
    }

    get type() {
      return "extended-attribute";
    }
    get name() {
      return this.tokens.name.value;
    }
    get rhs() {
      const { rhsType: type, tokens, list } = this.params;
      if (!type) {
        return null;
      }
      const value = type === "identifier-list" ? list : tokens.secondaryName.value;
      return { type, value };
    }
    get arguments() {
      const { rhsType, list } = this.params;
      if (!list || rhsType === "identifier-list") {
        return [];
      }
      return list;
    }
  }

  // Note: we parse something simpler than the official syntax. It's all that ever
  // seems to be used
  class ExtendedAttributes extends Base {
    static parse() {
      const tokens = {};
      tokens.open = consume("[");
      if (!tokens.open) return null;
      const ret = new ExtendedAttributes({ source, tokens });
      ret.items = list(tokeniser, {
        parser: SimpleExtendedAttribute.parse,
        listName: "extended attribute"
      });
      tokens.close = consume("]") || error("Unexpected form of extended attribute");
      if (!ret.items.length) {
        error("Found an empty extended attribute");
      }
      return ret;
    }
  }

  class Constant extends Base {
    static parse() {
      const tokens = {};
      tokens.base = consume("const");
      if (!tokens.base) {
        return;
      }
      let idlType = primitive_type();
      if (!idlType) {
        const base = consume(ID) || error("No type for const");
        idlType = new Type({ source, tokens: { base } });
      }
      if (probe("?")) {
        error("Unexpected nullable constant type");
      }
      idlType.type = "const-type";
      tokens.name = consume(ID) || error("No name for const");
      tokens.assign = consume("=") || error("No value assignment for const");
      tokens.value = const_value(tokeniser) || error("No value for const");
      tokens.termination = consume(";") || error("Unterminated const");
      const ret = new Constant({ source, tokens });
      ret.idlType = idlType;
      return ret;
    }

    get type() {
      return "const";
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
    get value() {
      return const_data(this.tokens.value);
    }
  }

  class CallbackFunction extends Base {
    static parse(base) {
      const tokens = { base };
      const ret = new CallbackFunction({ source, tokens });
      tokens.name = consume(ID) || error("No name for callback");
      tokeniser.current = ret;
      tokens.assign = consume("=") || error("No assignment in callback");
      ret.idlType = return_type() || error("Missing return type");
      tokens.open = consume("(") || error("No arguments in callback");
      ret.arguments = argument_list();
      tokens.close = consume(")") || error("Unterminated callback");
      tokens.termination = consume(";") || error("Unterminated callback");
      return ret;
    }

    get type() {
      return "callback";
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
  }

  function callback() {
    const callback = consume("callback");
    if (!callback) return;
    const tok = consume("interface");
    if (tok) {
      return Interface.parse(tok, { callback });
    }
    return CallbackFunction.parse(callback);
  }

  class Attribute extends Base {
    static parse({ special, noInherit = false, readonly = false } = {}) {
      const start_position = tokeniser.position;
      const tokens = { special };
      const ret = new Attribute({ source, tokens });
      if (!special && !noInherit) {
        tokens.special = consume("inherit");
      }
      tokens.readonly = consume("readonly");
      if (readonly && !tokens.readonly && probe("attribute")) {
        error("Attributes must be readonly in this context");
      }
      tokens.base = consume("attribute");
      if (!tokens.base) {
        unconsume(start_position);
        return;
      }
      ret.idlType = type_with_extended_attributes("attribute-type") || error("No type in attribute");
      switch (ret.idlType.generic) {
        case "sequence":
        case "record": error(`Attributes cannot accept ${ret.idlType.generic} types`);
      }
      tokens.name = consume(ID, "required") || error("No name in attribute");
      tokens.termination = consume(";") || error("Unterminated attribute");
      return ret;
    }

    get type() {
      return "attribute";
    }
    get special() {
      if (!this.tokens.special) {
        return "";
      }
      return this.tokens.special.value;
    }
    get readonly() {
      return !!this.tokens.readonly;
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
  }

  function return_type(typeName) {
    const typ = type(typeName || "return-type");
    if (typ) {
      return typ;
    }
    const voidToken = consume("void");
    if (voidToken) {
      const ret = new Type({ source, tokens: { base: voidToken } });
      ret.type = "return-type";
      return ret;
    }
  }

  class OperationBody extends Base {
    static parse() {
      const tokens = {};
      const ret = new OperationBody({ source, tokens });
      ret.idlType = return_type() || error("Missing return type");
      tokens.name = consume(ID);
      tokens.open = consume("(") || error("Invalid operation");
      ret.arguments = argument_list();
      tokens.close = consume(")") || error("Unterminated operation");
      return ret;
    }

    get name() {
      const { name } = this.tokens;
      if (!name) {
        return "";
      }
      return unescape(name.value);
    }
  }

  class Operation extends Base {
    static parse({ special, regular } = {}) {
      const tokens = { special };
      const ret = new Operation({ source, tokens });
      if (special && special.value === "stringifier") {
        tokens.termination = consume(";");
        if (tokens.termination) {
          ret.body = null;
          return ret;
        }
      }
      if (!special && !regular) {
        tokens.special = consume("getter", "setter", "deleter");
      }
      ret.body = OperationBody.parse();
      tokens.termination = consume(";") || error("Unterminated attribute");
      return ret;
    }

    get type() {
      return "operation";
    }
    get name() {
      return (this.body && this.body.name) || "";
    }
    get special() {
      if (!this.tokens.special) {
        return "";
      }
      return this.tokens.special.value;
    }
  }

  function static_member() {
    const special = consume("static");
    if (!special) return;
    const member = Attribute.parse({ special }) ||
      Operation.parse({ special }) ||
      error("No body in static member");
    return member;
  }

  function stringifier() {
    const special = consume("stringifier");
    if (!special) return;
    const member = Attribute.parse({ special }) ||
      Operation.parse({ special }) ||
      error("Unterminated stringifier");
    return member;
  }

  class IterableLike extends Base {
    static parse() {
      const start_position = tokeniser.position;
      const tokens = {};
      const ret = new IterableLike({ source, tokens });
      tokens.readonly = consume("readonly");
      tokens.base = tokens.readonly ?
        consume("maplike", "setlike") :
        consume("iterable", "maplike", "setlike");
      if (!tokens.base) {
        unconsume(start_position);
        return;
      }

      const { type } = ret;
      const secondTypeRequired = type === "maplike";
      const secondTypeAllowed = secondTypeRequired || type === "iterable";

      tokens.open = consume("<") || error(`Error parsing ${type} declaration`);
      const first = type_with_extended_attributes() || error(`Error parsing ${type} declaration`);
      ret.idlType = [first];
      if (secondTypeAllowed) {
        first.tokens.separator = consume(",");
        if (first.tokens.separator) {
          ret.idlType.push(type_with_extended_attributes());
        }
        else if (secondTypeRequired)
          error(`Missing second type argument in ${type} declaration`);
      }
      tokens.close = consume(">") || error(`Unterminated ${type} declaration`);
      tokens.termination = consume(";") || error(`Missing semicolon after ${type} declaration`);

      return ret;
    }

    get type() {
      return this.tokens.base.value;
    }
    get readonly() {
      return !!this.tokens.readonly;
    }
  }

  class Inheritance extends Base {
    static parse() {
      const colon = consume(":");
      if (!colon) {
        return;
      }
      const name = consume(ID) || error("No type in inheritance");
      return new Inheritance({ source, tokens: { colon, name } });
    }

    get name() {
      return unescape(this.tokens.name.value);
    }
  }

  class Container extends Base {
    static parse(instance, { type, inheritable, allowedMembers }) {
      const { tokens } = instance;
      tokens.name = consume(ID) || error("No name for interface");
      tokeniser.current = instance;
      if (inheritable) {
        instance.inheritance = Inheritance.parse() || null;
      }
      tokens.open = consume("{") || error(`Bodyless ${type}`);
      instance.members = [];
      while (true) {
        tokens.close = consume("}");
        if (tokens.close) {
          tokens.termination = consume(";") || error(`Missing semicolon after ${type}`);
          return instance;
        }
        const ea = ExtendedAttributes.parse();
        let mem;
        for (const [parser, ...args] of allowedMembers) {
          mem = parser(...args);
          if (mem) {
            break;
          }
        }
        if (!mem) {
          error("Unknown member");
        }
        mem.extAttrs = ea;
        instance.members.push(mem);
      }
    }

    get partial() {
      return !!this.tokens.partial;
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
  }

  class Interface extends Container {
    static parse(base, { callback = null, partial = null } = {}) {
      const tokens = { callback, partial, base };
      return Container.parse(new Interface({ source, tokens }), {
        type: "interface",
        inheritable: !partial,
        allowedMembers: [
          [Constant.parse],
          [static_member],
          [stringifier],
          [IterableLike.parse],
          [Attribute.parse],
          [Operation.parse]
        ]
      });
    }

    get type() {
      if (this.tokens.callback) {
        return "callback interface";
      }
      return "interface";
    }
  }

  class Mixin extends Container {
    static parse(base, { partial } = {}) {
      const tokens = { partial, base };
      tokens.mixin = consume("mixin");
      if (!tokens.mixin) {
        return;
      }
      return Container.parse(new Mixin({ source, tokens }), {
        type: "interface mixin",
        allowedMembers: [
          [Constant.parse],
          [stringifier],
          [Attribute.parse, { noInherit: true }],
          [Operation.parse, { regular: true }]
        ]
      });
    }

    get type() {
      return "interface mixin";
    }
  }

  function interface_(opts) {
    const base = consume("interface");
    if (!base) return;
    const ret = Mixin.parse(base, opts) ||
      Interface.parse(base, opts) ||
      error("Interface has no proper body");
    return ret;
  }

  class Namespace extends Container {
    static parse({ partial } = {}) {
      const tokens = { partial };
      tokens.base = consume("namespace");
      if (!tokens.base) {
        return;
      }
      return Container.parse(new Namespace({ source, tokens }), {
        type: "namespace",
        allowedMembers: [
          [Attribute.parse, { noInherit: true, readonly: true }],
          [Operation.parse, { regular: true }]
        ]
      });
    }

    get type() {
      return "namespace";
    }
  }

  function partial() {
    const partial = consume("partial");
    if (!partial) return;
    return Dictionary.parse({ partial }) ||
      interface_({ partial }) ||
      Namespace.parse({ partial }) ||
      error("Partial doesn't apply to anything");
  }

  class Dictionary extends Container {
    static parse({ partial } = {}) {
      const tokens = { partial };
      tokens.base = consume("dictionary");
      if (!tokens.base) {
        return;
      }
      return Container.parse(new Dictionary({ source, tokens }), {
        type: "dictionary",
        inheritable: !partial,
        allowedMembers: [
          [Field.parse],
        ]
      });
    }

    get type() {
      return "dictionary";
    }
  }

  class Field extends Base {
    static parse() {
      const tokens = {};
      const ret = new Field({ source, tokens });
      ret.extAttrs = ExtendedAttributes.parse();
      tokens.required = consume("required");
      ret.idlType = type_with_extended_attributes("dictionary-type") || error("No type for dictionary member");
      tokens.name = consume(ID) || error("No name for dictionary member");
      ret.default = Default.parse(tokeniser);
      if (tokens.required && ret.default) error("Required member must not have a default");
      tokens.termination = consume(";") || error("Unterminated dictionary member");
      return ret;
    }

    get type() {
      return "field";
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
    get required() {
      return !!this.tokens.required;
    }
  }

  class Typedef extends Base {
    static parse() {
      const tokens = {};
      const ret = new Typedef({ source, tokens });
      tokens.base = consume("typedef");
      if (!tokens.base) {
        return;
      }
      ret.idlType = type_with_extended_attributes("typedef-type") || error("No type in typedef");
      tokens.name = consume(ID) || error("No name in typedef");
      tokeniser.current = ret;
      tokens.termination = consume(";") || error("Unterminated typedef");
      return ret;
    }

    get type() {
      return "typedef";
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
  }

  function definition() {
    return callback() ||
      interface_() ||
      partial() ||
      Dictionary.parse() ||
      Enum.parse(tokeniser) ||
      Typedef.parse() ||
      Includes.parse(tokeniser) ||
      Namespace.parse();
  }

  function definitions() {
    if (!source.length) return [];
    const defs = [];
    while (true) {
      const ea = ExtendedAttributes.parse();
      const def = definition();
      if (!def) {
        if (ea) error("Stray extended attributes");
        break;
      }
      def.extAttrs = ea;
      defs.push(def);
    }
    defs.push(consume("eof"));
    return defs;
  }
  const res = definitions();
  if (tokeniser.position < source.length) error("Unrecognised tokens");
  return res;
}

export function parse(str) {
  const tokeniser = new Tokeniser(str);
  return parseByTokens(tokeniser);
}
