# Change Log

## [v20.0.1](https://github.com/w3c/webidl2.js/tree/v20.0.1) (2019-05-01)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v20.0.0...v20.0.1)

**Closed issues:**

- Is this the reference parser implementation for the latest webidl spec? [\#316](https://github.com/w3c/webidl2.js/issues/316)

**Merged pull requests:**

- refactor\(lib/webidl2\): enum as a module [\#318](https://github.com/w3c/webidl2.js/pull/318) ([saschanaz](https://github.com/saschanaz))
- fix\(lib/webidl2\): emit error message correctly [\#317](https://github.com/w3c/webidl2.js/pull/317) ([saschanaz](https://github.com/saschanaz))
- docs\(lib/writer\): document generic\(\) [\#315](https://github.com/w3c/webidl2.js/pull/315) ([saschanaz](https://github.com/saschanaz))

## [v20.0.0](https://github.com/w3c/webidl2.js/tree/v20.0.0) (2019-04-30)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v19.0.1...v20.0.0)

**Merged pull requests:**

- BREAKING CHANGE: introduce `generic\(\)` writer hook [\#314](https://github.com/w3c/webidl2.js/pull/314) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/webidl2\): modularize Default [\#312](https://github.com/w3c/webidl2.js/pull/312) ([saschanaz](https://github.com/saschanaz))
- refactor: modularize Token and list\(\) [\#311](https://github.com/w3c/webidl2.js/pull/311) ([saschanaz](https://github.com/saschanaz))
- refactor: modularize Includes [\#310](https://github.com/w3c/webidl2.js/pull/310) ([saschanaz](https://github.com/saschanaz))

## [v19.0.1](https://github.com/w3c/webidl2.js/tree/v19.0.1) (2019-04-19)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v19.0.0...v19.0.1)

**Merged pull requests:**

- fix\(lib/writer\): call ts.trivia with actual string [\#309](https://github.com/w3c/webidl2.js/pull/309) ([saschanaz](https://github.com/saschanaz))

## [v19.0.0](https://github.com/w3c/webidl2.js/tree/v19.0.0) (2019-04-18)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v18.0.1...v19.0.0)

**Closed issues:**

- Keyword `float` and type `float` is ambiguous [\#302](https://github.com/w3c/webidl2.js/issues/302)
- Docs: Trivia object not well defined [\#225](https://github.com/w3c/webidl2.js/issues/225)
- Meta - conforming Web IDL validator [\#138](https://github.com/w3c/webidl2.js/issues/138)

**Merged pull requests:**

- fix\(lib/webidl2\): restore error fields [\#308](https://github.com/w3c/webidl2.js/pull/308) ([saschanaz](https://github.com/saschanaz))
- fix\(webidl2\): rename float as decimal [\#307](https://github.com/w3c/webidl2.js/pull/307) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove all trivia fields [\#306](https://github.com/w3c/webidl2.js/pull/306) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove baseName and escaped\* fields [\#305](https://github.com/w3c/webidl2.js/pull/305) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove token fields [\#304](https://github.com/w3c/webidl2.js/pull/304) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove trivia from boolean fields [\#303](https://github.com/w3c/webidl2.js/pull/303) ([saschanaz](https://github.com/saschanaz))
- refactor: merge error functions [\#299](https://github.com/w3c/webidl2.js/pull/299) ([saschanaz](https://github.com/saschanaz))
- fix\(checker\): add an empty line between messages [\#298](https://github.com/w3c/webidl2.js/pull/298) ([saschanaz](https://github.com/saschanaz))

## [v18.0.1](https://github.com/w3c/webidl2.js/tree/v18.0.1) (2019-03-22)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v18.0.0...v18.0.1)

## [v18.0.0](https://github.com/w3c/webidl2.js/tree/v18.0.0) (2019-03-22)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v17.0.2...v18.0.0)

**Closed issues:**

- Argument cannot have double extended attributes [\#191](https://github.com/w3c/webidl2.js/issues/191)
- Rename idlType.idlType [\#136](https://github.com/w3c/webidl2.js/issues/136)

**Merged pull requests:**

- fix\(lib/validator\): validate when overloads are all from mixins [\#296](https://github.com/w3c/webidl2.js/pull/296) ([saschanaz](https://github.com/saschanaz))
- refactor: use module for checker [\#295](https://github.com/w3c/webidl2.js/pull/295) ([saschanaz](https://github.com/saschanaz))
- fix: update checker to use webpack build result [\#294](https://github.com/w3c/webidl2.js/pull/294) ([saschanaz](https://github.com/saschanaz))
- refactor: use ES module syntax and bundle by webpack [\#293](https://github.com/w3c/webidl2.js/pull/293) ([saschanaz](https://github.com/saschanaz))
- feat: add validation feature to the checker page [\#292](https://github.com/w3c/webidl2.js/pull/292) ([saschanaz](https://github.com/saschanaz))
- refactor: remove remaining JSON idlTypes [\#291](https://github.com/w3c/webidl2.js/pull/291) ([saschanaz](https://github.com/saschanaz))
- refactor: use Type for primitive types [\#290](https://github.com/w3c/webidl2.js/pull/290) ([saschanaz](https://github.com/saschanaz))
- refactor: generic type as a class [\#289](https://github.com/w3c/webidl2.js/pull/289) ([saschanaz](https://github.com/saschanaz))
- refactor: union type as a class [\#288](https://github.com/w3c/webidl2.js/pull/288) ([saschanaz](https://github.com/saschanaz))
- refactor: argument as a class [\#287](https://github.com/w3c/webidl2.js/pull/287) ([saschanaz](https://github.com/saschanaz))
- fix\(lib/webidl2\): disallow empty generic type [\#286](https://github.com/w3c/webidl2.js/pull/286) ([saschanaz](https://github.com/saschanaz))
- refactor: use list\(\) in identifiers\(\)/enums [\#285](https://github.com/w3c/webidl2.js/pull/285) ([saschanaz](https://github.com/saschanaz))
- fix\(lib/webidl2\): disallow null on constants [\#284](https://github.com/w3c/webidl2.js/pull/284) ([saschanaz](https://github.com/saschanaz))
- refactor: extended attributes as a class [\#283](https://github.com/w3c/webidl2.js/pull/283) ([saschanaz](https://github.com/saschanaz))
- refactor: extended attribute as a class [\#282](https://github.com/w3c/webidl2.js/pull/282) ([saschanaz](https://github.com/saschanaz))
- refactor: default value as a class [\#281](https://github.com/w3c/webidl2.js/pull/281) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: constant as a class [\#280](https://github.com/w3c/webidl2.js/pull/280) ([saschanaz](https://github.com/saschanaz))
- test\(lib/webidl2\): nullable constant with typedef identifiers [\#279](https://github.com/w3c/webidl2.js/pull/279) ([saschanaz](https://github.com/saschanaz))
- refactor: callback function as a class  [\#278](https://github.com/w3c/webidl2.js/pull/278) ([saschanaz](https://github.com/saschanaz))
- test\(lib/webidl2\): case for double extended attributes in arguments [\#277](https://github.com/w3c/webidl2.js/pull/277) ([saschanaz](https://github.com/saschanaz))
- refactor: attribute as a class [\#276](https://github.com/w3c/webidl2.js/pull/276) ([saschanaz](https://github.com/saschanaz))
- refactor: operation as a class [\#275](https://github.com/w3c/webidl2.js/pull/275) ([saschanaz](https://github.com/saschanaz))
- refactor: iterable as a class [\#274](https://github.com/w3c/webidl2.js/pull/274) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/writer\): use tokens object in container\(\) [\#273](https://github.com/w3c/webidl2.js/pull/273) ([saschanaz](https://github.com/saschanaz))
- refactor: interface/mixin as classes [\#272](https://github.com/w3c/webidl2.js/pull/272) ([saschanaz](https://github.com/saschanaz))
- refactor: namespace as a class [\#271](https://github.com/w3c/webidl2.js/pull/271) ([saschanaz](https://github.com/saschanaz))
- refactor: dictionary as a class [\#270](https://github.com/w3c/webidl2.js/pull/270) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/webidl2\): move toJSON to Definition [\#269](https://github.com/w3c/webidl2.js/pull/269) ([saschanaz](https://github.com/saschanaz))
- refactor: field as a class [\#268](https://github.com/w3c/webidl2.js/pull/268) ([saschanaz](https://github.com/saschanaz))
- refactor: enum as a class [\#267](https://github.com/w3c/webidl2.js/pull/267) ([saschanaz](https://github.com/saschanaz))
- refactor: typedef as a class [\#266](https://github.com/w3c/webidl2.js/pull/266) ([saschanaz](https://github.com/saschanaz))
- refactor: includes as a class [\#265](https://github.com/w3c/webidl2.js/pull/265) ([saschanaz](https://github.com/saschanaz))
- chore: add .gitattributes [\#264](https://github.com/w3c/webidl2.js/pull/264) ([saschanaz](https://github.com/saschanaz))
- style: apply no-trailing-spaces [\#263](https://github.com/w3c/webidl2.js/pull/263) ([saschanaz](https://github.com/saschanaz))
- refactor: self-containing classes [\#262](https://github.com/w3c/webidl2.js/pull/262) ([saschanaz](https://github.com/saschanaz))

## [v17.0.2](https://github.com/w3c/webidl2.js/tree/v17.0.2) (2019-02-15)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v17.0.1...v17.0.2)

**Closed issues:**

- Point GitHub Pages at the master branch so the checker can be used online [\#259](https://github.com/w3c/webidl2.js/issues/259)

**Merged pull requests:**

- fix\(lib/webidl2\): allow a preceding hyphen for identifiers [\#261](https://github.com/w3c/webidl2.js/pull/261) ([saschanaz](https://github.com/saschanaz))
- fix\(checker\): avoid using innerText [\#260](https://github.com/w3c/webidl2.js/pull/260) ([saschanaz](https://github.com/saschanaz))
- fix\(lib/webidl2\): restore enum value string form in error [\#258](https://github.com/w3c/webidl2.js/pull/258) ([saschanaz](https://github.com/saschanaz))
- Lowercase the example namespace "Console" [\#257](https://github.com/w3c/webidl2.js/pull/257) ([foolip](https://github.com/foolip))

## [v17.0.1](https://github.com/w3c/webidl2.js/tree/v17.0.1) (2018-12-11)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v17.0.0...v17.0.1)

**Closed issues:**

- idlTypes should unescape type name [\#252](https://github.com/w3c/webidl2.js/issues/252)
- Union type must not allow `any` type [\#250](https://github.com/w3c/webidl2.js/issues/250)
- Include statements do not unescape type names [\#249](https://github.com/w3c/webidl2.js/issues/249)

**Merged pull requests:**

- fix\(lib/webidl2\): prevent any in a union type [\#254](https://github.com/w3c/webidl2.js/pull/254) ([saschanaz](https://github.com/saschanaz))
- fix: unescape includes/idlTypes/inheritances [\#253](https://github.com/w3c/webidl2.js/pull/253) ([saschanaz](https://github.com/saschanaz))
- feat\(lib/webidl\): subclass standard error [\#247](https://github.com/w3c/webidl2.js/pull/247) ([saschanaz](https://github.com/saschanaz))

## [v17.0.0](https://github.com/w3c/webidl2.js/tree/v17.0.0) (2018-12-08)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v16.1.0...v17.0.0)

**Closed issues:**

- Arguments shouldn't get its own extended attributes [\#246](https://github.com/w3c/webidl2.js/issues/246)
- Modify writer to be ReSpec compatible [\#210](https://github.com/w3c/webidl2.js/issues/210)

**Merged pull requests:**

- BREAKING CHANGE: remove .extAttrs from arguments [\#248](https://github.com/w3c/webidl2.js/pull/248) ([saschanaz](https://github.com/saschanaz))

## [v16.1.0](https://github.com/w3c/webidl2.js/tree/v16.1.0) (2018-12-02)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v16.0.0...v16.1.0)

**Closed issues:**

- Emit preceding tokens for error messages [\#180](https://github.com/w3c/webidl2.js/issues/180)

**Merged pull requests:**

- Add unit tests for writer template functions [\#245](https://github.com/w3c/webidl2.js/pull/245) ([saschanaz](https://github.com/saschanaz))
- feat\(lib/webidl2\): better error messages  [\#244](https://github.com/w3c/webidl2.js/pull/244) ([saschanaz](https://github.com/saschanaz))
- Add docs for template feature [\#243](https://github.com/w3c/webidl2.js/pull/243) ([saschanaz](https://github.com/saschanaz))
- \[WIP\] write\(\) with optional templates [\#241](https://github.com/w3c/webidl2.js/pull/241) ([saschanaz](https://github.com/saschanaz))

## [v16.0.0](https://github.com/w3c/webidl2.js/tree/v16.0.0) (2018-11-24)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v15.0.0...v16.0.0)

**Implemented enhancements:**

- eslint: prevent eval\(\) [\#234](https://github.com/w3c/webidl2.js/pull/234) ([tripu](https://github.com/tripu))

**Closed issues:**

- Revise README document about testing [\#164](https://github.com/w3c/webidl2.js/issues/164)
- document white space [\#97](https://github.com/w3c/webidl2.js/issues/97)
- types of types [\#93](https://github.com/w3c/webidl2.js/issues/93)

**Merged pull requests:**

- BREAKING CHANGE: merge modifier fields [\#240](https://github.com/w3c/webidl2.js/pull/240) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/writer\): use interface\_like\(\) [\#239](https://github.com/w3c/webidl2.js/pull/239) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/writer\): use token\(\) [\#238](https://github.com/w3c/webidl2.js/pull/238) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/writer\): reduce conditional constructs [\#237](https://github.com/w3c/webidl2.js/pull/237) ([saschanaz](https://github.com/saschanaz))
- Remove jscoverage file and guide [\#236](https://github.com/w3c/webidl2.js/pull/236) ([saschanaz](https://github.com/saschanaz))
- chore\(package\): update eslint [\#235](https://github.com/w3c/webidl2.js/pull/235) ([saschanaz](https://github.com/saschanaz))

## [v15.0.0](https://github.com/w3c/webidl2.js/tree/v15.0.0) (2018-10-11)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v14.0.1...v15.0.0)

**Fixed bugs:**

- Some leading underscores are no longer removed [\#228](https://github.com/w3c/webidl2.js/issues/228)

**Closed issues:**

- Enum value type should be "enum-value" not "string" [\#231](https://github.com/w3c/webidl2.js/issues/231)
- \[ExtendedAttribute=null\] no longer parses [\#227](https://github.com/w3c/webidl2.js/issues/227)
- Promise\<void\> doesn't parse [\#226](https://github.com/w3c/webidl2.js/issues/226)
- Extended attributes parser is too permissive [\#222](https://github.com/w3c/webidl2.js/issues/222)
- Update changelog [\#215](https://github.com/w3c/webidl2.js/issues/215)
- Remove implements statement support [\#98](https://github.com/w3c/webidl2.js/issues/98)

**Merged pull requests:**

- docs\(README\): enum value's type is now enum-value [\#233](https://github.com/w3c/webidl2.js/pull/233) ([marcoscaceres](https://github.com/marcoscaceres))
- fix: enum values should be of type enum-value [\#232](https://github.com/w3c/webidl2.js/pull/232) ([marcoscaceres](https://github.com/marcoscaceres))
- fix: escape non-member top identifiers [\#229](https://github.com/w3c/webidl2.js/pull/229) ([saschanaz](https://github.com/saschanaz))
- fix\(lib/webidl\): disallow multiple special keywords [\#224](https://github.com/w3c/webidl2.js/pull/224) ([saschanaz](https://github.com/saschanaz))
- refactor\(lib/writer\): horizontally shorter type\(\) [\#221](https://github.com/w3c/webidl2.js/pull/221) ([saschanaz](https://github.com/saschanaz))
- chore\(README\): operation body always has idlType [\#218](https://github.com/w3c/webidl2.js/pull/218) ([saschanaz](https://github.com/saschanaz))
- DO NOT MERGE YET: Drop support for implements statement [\#106](https://github.com/w3c/webidl2.js/pull/106) ([saschanaz](https://github.com/saschanaz))

## [v14.0.1](https://github.com/w3c/webidl2.js/tree/v14.0.1) (2018-06-20)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v14.0.0...v14.0.1)

**Merged pull requests:**

- fix\(index\): import writer from index [\#219](https://github.com/w3c/webidl2.js/pull/219) ([saschanaz](https://github.com/saschanaz))

## [v14.0.0](https://github.com/w3c/webidl2.js/tree/v14.0.0) (2018-06-19)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v13.0.3...v14.0.0)

**Closed issues:**

- Use ESLint \(with Travis\) [\#167](https://github.com/w3c/webidl2.js/issues/167)
- Support full whitespace conservation [\#125](https://github.com/w3c/webidl2.js/issues/125)

**Merged pull requests:**

- Document changes for idlType and extAttrs [\#217](https://github.com/w3c/webidl2.js/pull/217) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove support for legacyiterable [\#216](https://github.com/w3c/webidl2.js/pull/216) ([saschanaz](https://github.com/saschanaz))
- Document trivia for root type declarations/members [\#214](https://github.com/w3c/webidl2.js/pull/214) ([saschanaz](https://github.com/saschanaz))
- Document trivia for iterable-likes [\#213](https://github.com/w3c/webidl2.js/pull/213) ([saschanaz](https://github.com/saschanaz))
- Document trivia for interfaces/mixins/namespaces [\#212](https://github.com/w3c/webidl2.js/pull/212) ([saschanaz](https://github.com/saschanaz))
- Document generic array, escapedName and removal of sequence [\#211](https://github.com/w3c/webidl2.js/pull/211) ([saschanaz](https://github.com/saschanaz))
- Add trivia for implements/includes [\#209](https://github.com/w3c/webidl2.js/pull/209) ([saschanaz](https://github.com/saschanaz))
- Add trivia for enums and typedefs [\#207](https://github.com/w3c/webidl2.js/pull/207) ([saschanaz](https://github.com/saschanaz))
- Add trivia for callbacks [\#206](https://github.com/w3c/webidl2.js/pull/206) ([saschanaz](https://github.com/saschanaz))
- Add trivia for partial types [\#205](https://github.com/w3c/webidl2.js/pull/205) ([saschanaz](https://github.com/saschanaz))
- Add trivia for dictionaries [\#204](https://github.com/w3c/webidl2.js/pull/204) ([saschanaz](https://github.com/saschanaz))
- Add trivia for mixins and namespaces [\#203](https://github.com/w3c/webidl2.js/pull/203) ([saschanaz](https://github.com/saschanaz))
- Use eslint minimally [\#202](https://github.com/w3c/webidl2.js/pull/202) ([saschanaz](https://github.com/saschanaz))
- Add trivia for extended attributes [\#201](https://github.com/w3c/webidl2.js/pull/201) ([saschanaz](https://github.com/saschanaz))
- Add trivia for extended attribute identifiers [\#200](https://github.com/w3c/webidl2.js/pull/200) ([saschanaz](https://github.com/saschanaz))
- Add trivia for const member type [\#199](https://github.com/w3c/webidl2.js/pull/199) ([saschanaz](https://github.com/saschanaz))
- Add trivia for arguments [\#198](https://github.com/w3c/webidl2.js/pull/198) ([saschanaz](https://github.com/saschanaz))
- Add trivia for operation [\#197](https://github.com/w3c/webidl2.js/pull/197) ([saschanaz](https://github.com/saschanaz))
- Add trivia for inheritance [\#195](https://github.com/w3c/webidl2.js/pull/195) ([saschanaz](https://github.com/saschanaz))
- Add trivia for iterable declarations [\#194](https://github.com/w3c/webidl2.js/pull/194) ([saschanaz](https://github.com/saschanaz))
- Add trivia for modifiers [\#193](https://github.com/w3c/webidl2.js/pull/193) ([saschanaz](https://github.com/saschanaz))
- Add trivia for idlTypes [\#192](https://github.com/w3c/webidl2.js/pull/192) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: move nullable field from const type to .idlType [\#189](https://github.com/w3c/webidl2.js/pull/189) ([saschanaz](https://github.com/saschanaz))
- Generics always as an array [\#188](https://github.com/w3c/webidl2.js/pull/188) ([saschanaz](https://github.com/saschanaz))
- fix: prevent empty iterable declaration [\#187](https://github.com/w3c/webidl2.js/pull/187) ([saschanaz](https://github.com/saschanaz))
- Add trivia field for interfaces/mixins [\#186](https://github.com/w3c/webidl2.js/pull/186) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: support full whitespace conservation [\#185](https://github.com/w3c/webidl2.js/pull/185) ([saschanaz](https://github.com/saschanaz))

## [v13.0.3](https://github.com/w3c/webidl2.js/tree/v13.0.3) (2018-06-04)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v13.0.2...v13.0.3)

**Merged pull requests:**

- refactor\(lib/writer\): remove args\(\) [\#184](https://github.com/w3c/webidl2.js/pull/184) ([saschanaz](https://github.com/saschanaz))
- refactor: consume argument name in object spread way [\#183](https://github.com/w3c/webidl2.js/pull/183) ([saschanaz](https://github.com/saschanaz))

## [v13.0.2](https://github.com/w3c/webidl2.js/tree/v13.0.2) (2018-05-30)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v13.0.1...v13.0.2)

**Closed issues:**

- Issue with parsing attribute identifiers [\#181](https://github.com/w3c/webidl2.js/issues/181)

**Merged pull requests:**

- fix: allow required for an attribute name [\#182](https://github.com/w3c/webidl2.js/pull/182) ([saschanaz](https://github.com/saschanaz))

## [v13.0.1](https://github.com/w3c/webidl2.js/tree/v13.0.1) (2018-05-30)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v13.0.0...v13.0.1)

**Closed issues:**

- No opening bracket after sequence [\#178](https://github.com/w3c/webidl2.js/issues/178)

**Merged pull requests:**

- refactor: unconsume by position [\#179](https://github.com/w3c/webidl2.js/pull/179) ([saschanaz](https://github.com/saschanaz))

## [v13.0.0](https://github.com/w3c/webidl2.js/tree/v13.0.0) (2018-05-29)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v12.1.4...v13.0.0)

**Fixed bugs:**

- Trailing comma in arguments list with valid IDL [\#169](https://github.com/w3c/webidl2.js/issues/169)
- Error parsing generic type with Promise\<void\> [\#168](https://github.com/w3c/webidl2.js/issues/168)

**Closed issues:**

- Do we want idlType.sequence? [\#174](https://github.com/w3c/webidl2.js/issues/174)
- Spaced three-dot shouldn't recognized as a variadic mark [\#162](https://github.com/w3c/webidl2.js/issues/162)

**Merged pull requests:**

- fix: consume return type for promise subtype [\#177](https://github.com/w3c/webidl2.js/pull/177) ([saschanaz](https://github.com/saschanaz))
- Add probe\(\) function [\#176](https://github.com/w3c/webidl2.js/pull/176) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove idlType.sequence [\#175](https://github.com/w3c/webidl2.js/pull/175) ([saschanaz](https://github.com/saschanaz))
- fix: prevent incorrect spaced negative infinity and variadic marks [\#173](https://github.com/w3c/webidl2.js/pull/173) ([saschanaz](https://github.com/saschanaz))
- refactor: merge operation functions [\#172](https://github.com/w3c/webidl2.js/pull/172) ([saschanaz](https://github.com/saschanaz))
- fix: allow selected keywords in argument name [\#171](https://github.com/w3c/webidl2.js/pull/171) ([saschanaz](https://github.com/saschanaz))
- fix: write inherit readonly attribute in proper order [\#170](https://github.com/w3c/webidl2.js/pull/170) ([saschanaz](https://github.com/saschanaz))
- refactor: merge attribute functions [\#166](https://github.com/w3c/webidl2.js/pull/166) ([saschanaz](https://github.com/saschanaz))

## [v12.1.4](https://github.com/w3c/webidl2.js/tree/v12.1.4) (2018-05-23)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v12.1.3...v12.1.4)

**Merged pull requests:**

- fix: prevent readwrite attributes on namespaces  [\#165](https://github.com/w3c/webidl2.js/pull/165) ([saschanaz](https://github.com/saschanaz))

## [v12.1.3](https://github.com/w3c/webidl2.js/tree/v12.1.3) (2018-05-20)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v12.1.2...v12.1.3)

**Merged pull requests:**

- fix: prevent incorrect union types [\#163](https://github.com/w3c/webidl2.js/pull/163) ([saschanaz](https://github.com/saschanaz))

## [v12.1.2](https://github.com/w3c/webidl2.js/tree/v12.1.2) (2018-05-17)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v12.1.1...v12.1.2)

## [v12.1.1](https://github.com/w3c/webidl2.js/tree/v12.1.1) (2018-05-17)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v12.1.0...v12.1.1)

**Closed issues:**

- Request: tag releases [\#159](https://github.com/w3c/webidl2.js/issues/159)
- Remove test/\* things from npm [\#158](https://github.com/w3c/webidl2.js/issues/158)

**Merged pull requests:**

- fix: prevent tokeniser error when it meets \_0 [\#161](https://github.com/w3c/webidl2.js/pull/161) ([saschanaz](https://github.com/saschanaz))
- Add files field to package.json [\#160](https://github.com/w3c/webidl2.js/pull/160) ([saschanaz](https://github.com/saschanaz))

## [v12.1.0](https://github.com/w3c/webidl2.js/tree/v12.1.0) (2018-05-16)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v12.0.0...v12.1.0)

**Closed issues:**

- Named terminal symbols cannot be identifiers [\#156](https://github.com/w3c/webidl2.js/issues/156)

**Merged pull requests:**

- Prevent keywords from being identifiers [\#157](https://github.com/w3c/webidl2.js/pull/157) ([saschanaz](https://github.com/saschanaz))

## [v12.0.0](https://github.com/w3c/webidl2.js/tree/v12.0.0) (2018-05-11)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v11.0.0...v12.0.0)

**Closed issues:**

- Reduce release size [\#152](https://github.com/w3c/webidl2.js/issues/152)
- Keep supporting allowNestedTypedefs or not? [\#104](https://github.com/w3c/webidl2.js/issues/104)

**Merged pull requests:**

- BREAKING CHANGE: remove allowNestedTypedefs [\#155](https://github.com/w3c/webidl2.js/pull/155) ([saschanaz](https://github.com/saschanaz))
- Remove all\_ws\(\) and gather trivia implicitly [\#154](https://github.com/w3c/webidl2.js/pull/154) ([saschanaz](https://github.com/saschanaz))
- tests: Remove test/widlproc [\#153](https://github.com/w3c/webidl2.js/pull/153) ([marcoscaceres](https://github.com/marcoscaceres))

## [v11.0.0](https://github.com/w3c/webidl2.js/tree/v11.0.0) (2018-05-10)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.3.3...v11.0.0)

**Merged pull requests:**

- Prevent incorrect enums [\#151](https://github.com/w3c/webidl2.js/pull/151) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove opt.ws [\#150](https://github.com/w3c/webidl2.js/pull/150) ([saschanaz](https://github.com/saschanaz))
- chore\(package\): bump version number to 10.3.3 [\#149](https://github.com/w3c/webidl2.js/pull/149) ([saschanaz](https://github.com/saschanaz))

## [v10.3.3](https://github.com/w3c/webidl2.js/tree/v10.3.3) (2018-05-07)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.3.2...v10.3.3)

**Merged pull requests:**

- Refactor simple\_extended\_attr\(\); [\#148](https://github.com/w3c/webidl2.js/pull/148) ([saschanaz](https://github.com/saschanaz))
- Remove description about typePair [\#147](https://github.com/w3c/webidl2.js/pull/147) ([saschanaz](https://github.com/saschanaz))
- Add a web page implementing a simple WebIDL checker. [\#146](https://github.com/w3c/webidl2.js/pull/146) ([kenrussell](https://github.com/kenrussell))

## [v10.3.2](https://github.com/w3c/webidl2.js/tree/v10.3.2) (2018-04-16)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.3.1...v10.3.2)

**Merged pull requests:**

- Fix whitespace handling of implements and includes. [\#145](https://github.com/w3c/webidl2.js/pull/145) ([kenrussell](https://github.com/kenrussell))
- refactor: remove eas.length check [\#144](https://github.com/w3c/webidl2.js/pull/144) ([saschanaz](https://github.com/saschanaz))
- refactor: one-to-one match for token matcher [\#143](https://github.com/w3c/webidl2.js/pull/143) ([saschanaz](https://github.com/saschanaz))

## [v10.3.1](https://github.com/w3c/webidl2.js/tree/v10.3.1) (2018-03-17)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.3.0...v10.3.1)

**Merged pull requests:**

- const-type as full IDL Type [\#142](https://github.com/w3c/webidl2.js/pull/142) ([saschanaz](https://github.com/saschanaz))

## [v10.3.0](https://github.com/w3c/webidl2.js/tree/v10.3.0) (2018-03-17)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.2.1...v10.3.0)

**Merged pull requests:**

- Always add extAttrs for .idlType [\#141](https://github.com/w3c/webidl2.js/pull/141) ([saschanaz](https://github.com/saschanaz))
- docs\(README\): add types of types \[ci skip\] [\#140](https://github.com/w3c/webidl2.js/pull/140) ([saschanaz](https://github.com/saschanaz))

## [v10.2.1](https://github.com/w3c/webidl2.js/tree/v10.2.1) (2018-03-09)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.2.0...v10.2.1)

**Merged pull requests:**

- Optimise tokenisation and whitespace skipping [\#139](https://github.com/w3c/webidl2.js/pull/139) ([ricea](https://github.com/ricea))
- refactor: small syntax changes [\#137](https://github.com/w3c/webidl2.js/pull/137) ([saschanaz](https://github.com/saschanaz))

## [v10.2.0](https://github.com/w3c/webidl2.js/tree/v10.2.0) (2018-01-30)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.1.0...v10.2.0)

**Merged pull requests:**

- Type on union idlType [\#135](https://github.com/w3c/webidl2.js/pull/135) ([saschanaz](https://github.com/saschanaz))
- feat: add argument/return type [\#134](https://github.com/w3c/webidl2.js/pull/134) ([saschanaz](https://github.com/saschanaz))
- feat: add dictionary/typedef-type [\#133](https://github.com/w3c/webidl2.js/pull/133) ([saschanaz](https://github.com/saschanaz))
- feat: add const-type for idlTypes  [\#132](https://github.com/w3c/webidl2.js/pull/132) ([saschanaz](https://github.com/saschanaz))
- feat: add types on idlTypes [\#131](https://github.com/w3c/webidl2.js/pull/131) ([saschanaz](https://github.com/saschanaz))
- Auto acquisition for parser result changes [\#130](https://github.com/w3c/webidl2.js/pull/130) ([saschanaz](https://github.com/saschanaz))

## [v10.1.0](https://github.com/w3c/webidl2.js/tree/v10.1.0) (2018-01-19)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v10.0.0...v10.1.0)

**Closed issues:**

- Support `raises` and `setraises` [\#128](https://github.com/w3c/webidl2.js/issues/128)
- Support `legacycaller` [\#127](https://github.com/w3c/webidl2.js/issues/127)
- Improve "No semicolon after enum" message [\#119](https://github.com/w3c/webidl2.js/issues/119)

**Merged pull requests:**

- Let error messages include the current definition name [\#129](https://github.com/w3c/webidl2.js/pull/129) ([saschanaz](https://github.com/saschanaz))

## [v10.0.0](https://github.com/w3c/webidl2.js/tree/v10.0.0) (2017-12-20)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v9.0.0...v10.0.0)

**Closed issues:**

-  Always return an array for idlType, etc. [\#113](https://github.com/w3c/webidl2.js/issues/113)
- Maintain writer.js or not? [\#109](https://github.com/w3c/webidl2.js/issues/109)

**Merged pull requests:**

- Remove typeExtAttrs from docs [\#124](https://github.com/w3c/webidl2.js/pull/124) ([saschanaz](https://github.com/saschanaz))
- Remove iterator documentation [\#123](https://github.com/w3c/webidl2.js/pull/123) ([saschanaz](https://github.com/saschanaz))
- Maintain writer.js [\#122](https://github.com/w3c/webidl2.js/pull/122) ([saschanaz](https://github.com/saschanaz))
- BREAKING CHANGE: remove deprecated iterator operation [\#121](https://github.com/w3c/webidl2.js/pull/121) ([saschanaz](https://github.com/saschanaz))
- Use for-of on tests [\#120](https://github.com/w3c/webidl2.js/pull/120) ([saschanaz](https://github.com/saschanaz))
- docs\(README\): iterables ildType is always array [\#118](https://github.com/w3c/webidl2.js/pull/118) ([marcoscaceres](https://github.com/marcoscaceres))

## [v9.0.0](https://github.com/w3c/webidl2.js/tree/v9.0.0) (2017-11-30)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v8.1.0...v9.0.0)

**Closed issues:**

- Code quality [\#116](https://github.com/w3c/webidl2.js/issues/116)
- Unable to parse HTMLAllCollection interface [\#114](https://github.com/w3c/webidl2.js/issues/114)
- Add support for mixin syntax [\#112](https://github.com/w3c/webidl2.js/issues/112)
- Whitespace issues [\#111](https://github.com/w3c/webidl2.js/issues/111)

**Merged pull requests:**

- Consistent array type for iterable.idlType [\#117](https://github.com/w3c/webidl2.js/pull/117) ([saschanaz](https://github.com/saschanaz))
-  Revert "chore: drop Node 6 support \(\#102\)" [\#115](https://github.com/w3c/webidl2.js/pull/115) ([TimothyGu](https://github.com/TimothyGu))

## [v8.1.0](https://github.com/w3c/webidl2.js/tree/v8.1.0) (2017-11-03)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v8.0.1...v8.1.0)

**Closed issues:**

- Extended Attributes `rhs` should always be there [\#96](https://github.com/w3c/webidl2.js/issues/96)

**Merged pull requests:**

- Always add rhs property [\#110](https://github.com/w3c/webidl2.js/pull/110) ([saschanaz](https://github.com/saschanaz))

## [v8.0.1](https://github.com/w3c/webidl2.js/tree/v8.0.1) (2017-11-03)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v8.0.0...v8.0.1)

**Fixed bugs:**

- Comment order parsing bug  [\#107](https://github.com/w3c/webidl2.js/issues/107)

**Merged pull requests:**

- Remove m postfix from all\_ws\(\) [\#108](https://github.com/w3c/webidl2.js/pull/108) ([saschanaz](https://github.com/saschanaz))

## [v8.0.0](https://github.com/w3c/webidl2.js/tree/v8.0.0) (2017-11-03)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v7.0.0...v8.0.0)

**Closed issues:**

- Remove creators support [\#100](https://github.com/w3c/webidl2.js/issues/100)
- Add mixin support [\#92](https://github.com/w3c/webidl2.js/issues/92)

**Merged pull requests:**

- Support mixins + includes statements [\#105](https://github.com/w3c/webidl2.js/pull/105) ([saschanaz](https://github.com/saschanaz))
- chore: drop Node 6 support [\#102](https://github.com/w3c/webidl2.js/pull/102) ([marcoscaceres](https://github.com/marcoscaceres))
- BREAKING CHANGE: drop creator support [\#101](https://github.com/w3c/webidl2.js/pull/101) ([saschanaz](https://github.com/saschanaz))
- Normalize some whitespace to pass wpt's lint [\#99](https://github.com/w3c/webidl2.js/pull/99) ([foolip](https://github.com/foolip))

## [v7.0.0](https://github.com/w3c/webidl2.js/tree/v7.0.0) (2017-10-27)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v6.1.0...v7.0.0)

**Closed issues:**

- Type conversion on default values is destructive  [\#94](https://github.com/w3c/webidl2.js/issues/94)
- extended attribute structure missing type [\#89](https://github.com/w3c/webidl2.js/issues/89)

**Merged pull requests:**

-  BREAKING CHANGE: argument + default types should be string [\#95](https://github.com/w3c/webidl2.js/pull/95) ([marcoscaceres](https://github.com/marcoscaceres))

## [v6.1.0](https://github.com/w3c/webidl2.js/tree/v6.1.0) (2017-10-23)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v6.0.1...v6.1.0)

**Merged pull requests:**

- feat: give extended attributes a type [\#90](https://github.com/w3c/webidl2.js/pull/90) ([marcoscaceres](https://github.com/marcoscaceres))

## [v6.0.1](https://github.com/w3c/webidl2.js/tree/v6.0.1) (2017-10-18)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v6.0.0...v6.0.1)

**Closed issues:**

- Enum values should be objects [\#86](https://github.com/w3c/webidl2.js/issues/86)

**Merged pull requests:**

- Use ES2015 syntax for tests [\#88](https://github.com/w3c/webidl2.js/pull/88) ([saschanaz](https://github.com/saschanaz))

## [v6.0.0](https://github.com/w3c/webidl2.js/tree/v6.0.0) (2017-10-17)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v5.0.0...v6.0.0)

**Merged pull requests:**

- BREAKING CHANGE: ret enum value as object [\#87](https://github.com/w3c/webidl2.js/pull/87) ([marcoscaceres](https://github.com/marcoscaceres))

## [v5.0.0](https://github.com/w3c/webidl2.js/tree/v5.0.0) (2017-10-17)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v4.2.0...v5.0.0)

**Closed issues:**

- Unable to parse annotated types in generics [\#83](https://github.com/w3c/webidl2.js/issues/83)
- Drop support for Node 4, move to 6 LTS [\#82](https://github.com/w3c/webidl2.js/issues/82)

**Merged pull requests:**

- BREAKING CHANGE: Use ES2015 syntax [\#84](https://github.com/w3c/webidl2.js/pull/84) ([saschanaz](https://github.com/saschanaz))

## [v4.2.0](https://github.com/w3c/webidl2.js/tree/v4.2.0) (2017-10-16)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v4.1.0...v4.2.0)

**Closed issues:**

- Remove legacy caller support [\#78](https://github.com/w3c/webidl2.js/issues/78)
- Should report error for using duplicate names [\#77](https://github.com/w3c/webidl2.js/issues/77)

**Merged pull requests:**

- Check duplicated names [\#80](https://github.com/w3c/webidl2.js/pull/80) ([saschanaz](https://github.com/saschanaz))
- Remove legacycaller [\#79](https://github.com/w3c/webidl2.js/pull/79) ([saschanaz](https://github.com/saschanaz))
- Add "sequence" property to IDL Type AST definition [\#76](https://github.com/w3c/webidl2.js/pull/76) ([wilsonzlin](https://github.com/wilsonzlin))

## [v4.1.0](https://github.com/w3c/webidl2.js/tree/v4.1.0) (2017-07-04)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v4.0.0...v4.1.0)

**Closed issues:**

- Parsing error for annonated inner types of generic types [\#71](https://github.com/w3c/webidl2.js/issues/71)

**Merged pull requests:**

- Support TypeWithExtendedAttributes on generics [\#75](https://github.com/w3c/webidl2.js/pull/75) ([saschanaz](https://github.com/saschanaz))

## [v4.0.0](https://github.com/w3c/webidl2.js/tree/v4.0.0) (2017-06-27)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v3.0.2...v4.0.0)

**Closed issues:**

- Remove serializer-related productions [\#73](https://github.com/w3c/webidl2.js/issues/73)
- Records don't seem to be working right [\#72](https://github.com/w3c/webidl2.js/issues/72)
- Document namespace member output [\#59](https://github.com/w3c/webidl2.js/issues/59)

**Merged pull requests:**

- BREAKING CHANGE: remove serializers \(closes \#73\) [\#74](https://github.com/w3c/webidl2.js/pull/74) ([marcoscaceres](https://github.com/marcoscaceres))
- Add documentation for namespaces [\#70](https://github.com/w3c/webidl2.js/pull/70) ([saschanaz](https://github.com/saschanaz))

## [v3.0.2](https://github.com/w3c/webidl2.js/tree/v3.0.2) (2017-05-29)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v3.0.1...v3.0.2)

**Closed issues:**

- Whitespace issues [\#64](https://github.com/w3c/webidl2.js/issues/64)

**Merged pull requests:**

- Test for latest LTS/stable node versions [\#69](https://github.com/w3c/webidl2.js/pull/69) ([saschanaz](https://github.com/saschanaz))

## [v3.0.1](https://github.com/w3c/webidl2.js/tree/v3.0.1) (2017-05-18)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v2.4.0...v3.0.1)

**Closed issues:**

- Is array syntax dead? [\#66](https://github.com/w3c/webidl2.js/issues/66)
- Remove exceptions support [\#65](https://github.com/w3c/webidl2.js/issues/65)

**Merged pull requests:**

- Fix whitespace error on parsing extended attributes [\#68](https://github.com/w3c/webidl2.js/pull/68) ([saschanaz](https://github.com/saschanaz))
- Remove deprecated IDL arrays and exceptions [\#67](https://github.com/w3c/webidl2.js/pull/67) ([saschanaz](https://github.com/saschanaz))

## [v2.4.0](https://github.com/w3c/webidl2.js/tree/v2.4.0) (2017-04-12)
[Full Changelog](https://github.com/w3c/webidl2.js/compare/v2.1.0...v2.4.0)

**Closed issues:**

- Add support for Annotated Types [\#60](https://github.com/w3c/webidl2.js/issues/60)
- Question: Convert WebIDL -\> Javascript [\#56](https://github.com/w3c/webidl2.js/issues/56)
- Get Robin to give us push permissions on npm [\#54](https://github.com/w3c/webidl2.js/issues/54)
- Add support for records [\#53](https://github.com/w3c/webidl2.js/issues/53)
- module not supported? [\#52](https://github.com/w3c/webidl2.js/issues/52)
- Add support for namespaces [\#51](https://github.com/w3c/webidl2.js/issues/51)
- Export is not AMD compatible [\#48](https://github.com/w3c/webidl2.js/issues/48)
- Can't represent large constants [\#21](https://github.com/w3c/webidl2.js/issues/21)

**Merged pull requests:**

- Update webidl2.js [\#63](https://github.com/w3c/webidl2.js/pull/63) ([tqeto](https://github.com/tqeto))
- Remove support for MapClass \(no longer valid in WebIDL\) [\#62](https://github.com/w3c/webidl2.js/pull/62) ([dontcallmedom](https://github.com/dontcallmedom))
- Add support for annotated types [\#61](https://github.com/w3c/webidl2.js/pull/61) ([dontcallmedom](https://github.com/dontcallmedom))
- Support namespaces [\#58](https://github.com/w3c/webidl2.js/pull/58) ([saschanaz](https://github.com/saschanaz))
- Add support for records [\#57](https://github.com/w3c/webidl2.js/pull/57) ([TimothyGu](https://github.com/TimothyGu))
- Refactor [\#50](https://github.com/w3c/webidl2.js/pull/50) ([marcoscaceres](https://github.com/marcoscaceres))
- feat\(lib\): add AMD export support \(closes \#48\) [\#49](https://github.com/w3c/webidl2.js/pull/49) ([marcoscaceres](https://github.com/marcoscaceres))

## [v2.1.0](https://github.com/w3c/webidl2.js/tree/v2.1.0) (2016-08-12)
**Closed issues:**

- Exception when parsing test/syntax/idl/typedef.widl [\#46](https://github.com/w3c/webidl2.js/issues/46)
- Wrong jsondiffpatch location [\#42](https://github.com/w3c/webidl2.js/issues/42)
- 'npm install' fails on building microtime [\#40](https://github.com/w3c/webidl2.js/issues/40)
- Can't represent union types in typedefs [\#38](https://github.com/w3c/webidl2.js/issues/38)
- tokenise\(\) assumes a specific property enumeration order [\#27](https://github.com/w3c/webidl2.js/issues/27)
- Add support for iterable\<\>, maplike\<\>, setlike\<\> declarations [\#24](https://github.com/w3c/webidl2.js/issues/24)
- WebIDL2 fails to parse `attribute Promise\<DOMString\>\[\] baz` [\#19](https://github.com/w3c/webidl2.js/issues/19)
- Support for ExtendedAttributeIdentList \(current editor's draft\) [\#18](https://github.com/w3c/webidl2.js/issues/18)
- No Licensing Information [\#17](https://github.com/w3c/webidl2.js/issues/17)
- how to regenerate w3c idl files ? [\#14](https://github.com/w3c/webidl2.js/issues/14)
- What is lib/writer.js [\#13](https://github.com/w3c/webidl2.js/issues/13)
- Numerous tests are failing [\#7](https://github.com/w3c/webidl2.js/issues/7)
- Add support for missing types in ServiceWorker [\#5](https://github.com/w3c/webidl2.js/issues/5)
- How can I parse just a function? [\#3](https://github.com/w3c/webidl2.js/issues/3)
- Parser throws on nullable array of nullable array [\#2](https://github.com/w3c/webidl2.js/issues/2)
- Parser throws on nullable array of any [\#1](https://github.com/w3c/webidl2.js/issues/1)

**Merged pull requests:**

- Fix "default": undefined [\#47](https://github.com/w3c/webidl2.js/pull/47) ([mkwtys](https://github.com/mkwtys))
- Replace expect.js with expct [\#45](https://github.com/w3c/webidl2.js/pull/45) ([halton](https://github.com/halton))
- Correct jsondiffpatch location. [\#44](https://github.com/w3c/webidl2.js/pull/44) ([halton](https://github.com/halton))
- Bump microtime to 2.1.1 [\#43](https://github.com/w3c/webidl2.js/pull/43) ([halton](https://github.com/halton))
- Expand writer support [\#39](https://github.com/w3c/webidl2.js/pull/39) ([markandrus](https://github.com/markandrus))
- Accept wider \(but still incomplete\) set of allowed syntax for extended attributes [\#37](https://github.com/w3c/webidl2.js/pull/37) ([mlogan](https://github.com/mlogan))
- Add test for callback with multiple arguments. [\#36](https://github.com/w3c/webidl2.js/pull/36) ([tobie](https://github.com/tobie))
- Iterables [\#34](https://github.com/w3c/webidl2.js/pull/34) ([motiz88](https://github.com/motiz88))
- Allow trailing comma in enum value lists, per spec [\#33](https://github.com/w3c/webidl2.js/pull/33) ([motiz88](https://github.com/motiz88))
- Allow typedefs within interfaces \(behind an opt-in flag\) [\#32](https://github.com/w3c/webidl2.js/pull/32) ([motiz88](https://github.com/motiz88))
- In draft [\#31](https://github.com/w3c/webidl2.js/pull/31) ([othree](https://github.com/othree))
- Add support for extended attributes identifier lists [\#29](https://github.com/w3c/webidl2.js/pull/29) ([tobie](https://github.com/tobie))
- Make `attribute Promise\<T\>\[\] attr;` work. [\#26](https://github.com/w3c/webidl2.js/pull/26) ([jyasskin](https://github.com/jyasskin))
- Parse required dictionary fields. [\#25](https://github.com/w3c/webidl2.js/pull/25) ([jyasskin](https://github.com/jyasskin))
- Define the WebIDL2 property on self rather than window. [\#23](https://github.com/w3c/webidl2.js/pull/23) ([Ms2ger](https://github.com/Ms2ger))
- Teach WebIDL2 to parse \[\] default values. [\#22](https://github.com/w3c/webidl2.js/pull/22) ([jyasskin](https://github.com/jyasskin))
- Support ID list in extended attributes [\#20](https://github.com/w3c/webidl2.js/pull/20) ([othree](https://github.com/othree))
- Make sure that `sequence` property of idl types is set to false if the type is actually `sequence`. [\#16](https://github.com/w3c/webidl2.js/pull/16) ([tobie](https://github.com/tobie))
- Parametrized [\#15](https://github.com/w3c/webidl2.js/pull/15) ([tobie](https://github.com/tobie))
- Add promise support [\#12](https://github.com/w3c/webidl2.js/pull/12) ([tobie](https://github.com/tobie))
- Remove broken coverage support from travis for now. [\#11](https://github.com/w3c/webidl2.js/pull/11) ([tobie](https://github.com/tobie))
- Add support for \[MapClass\(type, type\)\]. [\#10](https://github.com/w3c/webidl2.js/pull/10) ([tobie](https://github.com/tobie))
- Incorporate tests from widlproc\[1\] and remove dependency on said project. [\#9](https://github.com/w3c/webidl2.js/pull/9) ([tobie](https://github.com/tobie))
- README incorrectly recommended updating the widlproc submodule. [\#8](https://github.com/w3c/webidl2.js/pull/8) ([tobie](https://github.com/tobie))
- Fix bug where instrumented version of webidl2 was loaded. [\#6](https://github.com/w3c/webidl2.js/pull/6) ([tobie](https://github.com/tobie))
- Use https:// instead of git:// [\#4](https://github.com/w3c/webidl2.js/pull/4) ([Manishearth](https://github.com/Manishearth))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*