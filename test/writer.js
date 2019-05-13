"use strict";

const { collect } = require("./util/collect");
const expect = require("expect");
const webidl2 = require("../dist/webidl2");

describe("Rewrite and parses all of the IDLs to produce the same ASTs", () => {
  for (const test of collect("syntax")) {
    it(`should produce the same AST for ${test.path}`, () => {
      const rewritten = webidl2.write(test.ast);
      expect(rewritten).toEqual(test.text);
      const diff = test.diff(webidl2.parse(rewritten, test.opt));
      expect(diff).toBe(undefined);
    });
  }
});

describe("Writer template functions", () => {
  function rewrite(text, templates) {
    return webidl2.write(webidl2.parse(text), { templates });
  }
  function bracket(str) {
    return `<${str}>`;
  }
  function flatten(array) {
    return [].concat(...array.map(item => Array.isArray(item) ? flatten(item) : item));
  }

  it("wraps in array", () => {
    const result = rewrite("interface X {};", {
      wrap: items => flatten(items).filter(i => i)
    });
    expect(result).toEqual(["interface", " ", "X", " ", "{", "}", ";"]);
  });

  it("catches trivia", () => {
    const result = rewrite("/* longcat is long */ [Exposed=( Window )] interface X {};", {
      trivia: bracket
    });
    expect(result).toBe("</* longcat is long */ >[<>Exposed<>=<>(< >Window< >)<>]< >interface< >X< >{<>}<>;<>");
  });

  it("catches names", () => {
    function rewriteName(text) {
      return rewrite(text, { name: bracket });
    }

    const result = rewriteName("interface Momo { attribute long iro; };");
    expect(result).toBe("interface <Momo> { attribute long <iro>; };");

    const typedef = rewriteName("typedef float Float;");
    expect(typedef).toBe("typedef float <Float>;");

    const enumeration = rewriteName('enum Enum { "item", };');
    expect(enumeration).toBe('enum <Enum> { "<item>", };');

    const dictionary = rewriteName("dictionary Dict { required short field; };");
    expect(dictionary).toBe("dictionary <Dict> { required short <field>; };");

    const operation = rewriteName("namespace Console { void log(); };");
    expect(operation).toBe("namespace <Console> { void <log>(); };");

    const constant = rewriteName("interface Misaki { const short MICHELLE = 1; };");
    expect(constant).toBe("interface <Misaki> { const short <MICHELLE> = 1; };");
  });

  it("catches references", () => {
    function rewriteReference(text) {
      return rewrite(text, { reference: bracket });
    }

    const result = rewriteReference("[Exposed=Window] interface Momo : Kudamono { attribute Promise<unsigned long> iro; };");
    expect(result).toBe("[Exposed=<Window>] interface Momo : <Kudamono> { attribute Promise<<unsigned long>> iro; };");

    const includes = rewriteReference("_A includes _B;");
    expect(includes).toBe("<_A> includes <_B>;");
  });

  it("catches references as unescaped", () => {
    function rewriteReference(text) {
      return rewrite(text, { reference: (_, unescaped) => bracket(unescaped) });
    }

    const result = rewriteReference("[Exposed=Window] interface Momo : _Kudamono { attribute Promise<_Type> iro; attribute _Type sugar; };");
    expect(result).toBe("[Exposed=<Window>] interface Momo : <Kudamono> { attribute Promise<<Type>> iro; attribute <Type> sugar; };");

    const includes = rewriteReference("_A includes _B;");
    expect(includes).toBe("<A> includes <B>;");
  });

  it("catches generics", () => {
    function rewriteGeneric(text) {
      return rewrite(text, { generic: bracket });
    }

    const result = rewriteGeneric("[Exposed=Window] interface Momo : Kudamono { attribute Promise<Type> iro; iterable<float>; };");
    expect(result).toBe("[Exposed=Window] interface Momo : Kudamono { attribute <Promise><Type> iro; <iterable><float>; };");
  });

  it("catches types", () => {
    const result = rewrite("interface Momo { attribute Promise<unsigned long> iro; };", {
      type: bracket
    });
    expect(result).toBe("interface Momo { attribute< Promise<unsigned long>> iro; };");
  });

  it("catches inheritances", () => {
    const result = rewrite("dictionary Nene : Member { DOMString cpp = \"high\"; };", {
      inheritance: bracket
    });
    expect(result).toBe("dictionary Nene : <Member> { DOMString cpp = \"high\"; };");
  });

  it("catches definitions", () => {
    const result = rewrite("dictionary Nene { DOMString cpp = \"high\"; };", {
      definition: bracket
    });
    expect(result).toBe("<dictionary Nene {< DOMString cpp = \"high\";> };>");
  });

  it("catches extended attributes", () => {
    const result = rewrite("[Exposed=Window, Constructor] interface EagleJump { void aoba([Clamp] long work); };", {
      extendedAttribute: bracket
    });
    expect(result).toBe("[<Exposed=Window>, <Constructor>] interface EagleJump { void aoba([<Clamp>] long work); };");
  });

  it("catches extended attribute references", () => {
    const result = rewrite("[Exposed=Window, Constructor] interface EagleJump { void aoba([Clamp] long work); };", {
      extendedAttributeReference: bracket
    });
    expect(result).toBe("[<Exposed>=Window, <Constructor>] interface EagleJump { void aoba([<Clamp>] long work); };");
  });

  it("gives definition object", () => {
    function rewriteDefinition(text) {
      return rewrite(text, {
        definition: (def, { data, parent }) => {
          const parentType = parent ? `${parent.type}:` : "";
          return `${parentType}${data.type}[${def}]`;
        }
      });
    }

    const includes = rewriteDefinition("A includes B;");
    expect(includes).toBe("includes[A includes B;]");

    const typedef = rewriteDefinition("typedef A B;");
    expect(typedef).toBe("typedef[typedef A B;]");

    const enumeration = rewriteDefinition('enum A { "b", "c" };');
    expect(enumeration).toBe('enum[enum A { enum:enum-value["b"], enum:enum-value["c"] };]');

    const dictionary = rewriteDefinition("dictionary X { required DOMString str; };");
    expect(dictionary).toBe("dictionary[dictionary X {dictionary:field[ required DOMString str;] };]");

    const interface_ = rewriteDefinition("interface X { iterable<DOMString>; };");
    expect(interface_).toBe("interface[interface X {interface:iterable[ iterable<DOMString>;] };]");

    const operation = rewriteDefinition("namespace X { void log(); };");
    expect(operation).toBe("namespace[namespace X {namespace:operation[ void log();] };]");

    const attribute = rewriteDefinition("interface X { attribute short x; };");
    expect(attribute).toBe("interface[interface X {interface:attribute[ attribute short x;] };]");

    const constant = rewriteDefinition("interface Misaki { const short MICHELLE = 1; };");
    expect(constant).toBe("interface[interface Misaki {interface:const[ const short MICHELLE = 1;] };]");
  });
});
