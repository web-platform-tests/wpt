# Type Annotations

*attrs* comes with first-class support for type annotations for both {pep}`526` and legacy syntax.

However, they will remain *optional* forever, therefore the example from the README could also be written as:

```{doctest}
>>> from attrs import define, field

>>> @define
... class SomeClass:
...     a_number = field(default=42)
...     list_of_numbers = field(factory=list)

>>> sc = SomeClass(1, [1, 2, 3])
>>> sc
SomeClass(a_number=1, list_of_numbers=[1, 2, 3])
```

You can choose freely between the approaches, but please remember that if you choose to use type annotations, you **must** annotate **all** attributes!

:::{caution}
If you define a class with a {func}`attrs.field` that **lacks** a type annotation, *attrs* will **ignore** other fields that have a type annotation, but are not defined using {func}`attrs.field`:

```{doctest}
>>> @define
... class SomeClass:
...     a_number = field(default=42)
...     another_number: int = 23
>>> SomeClass()
SomeClass(a_number=42)
```
:::

Even when going all-in on type annotations, you will need {func}`attrs.field` for some advanced features, though.

One of those features are the decorator-based features like defaults.
It's important to remember that *attrs* doesn't do any magic behind your back.
All the decorators are implemented using an object that is returned by the call to {func}`attrs.field`.

Attributes that only carry a class annotation do not have that object so trying to call a method on it will inevitably fail.

---

Please note that types -- regardless how added -- are *only metadata* that can be queried from the class and they aren't used for anything out of the box!

Because Python does not allow references to a class object before the class is defined,
types may be defined as string literals, so-called *forward references* ({pep}`526`).
You can enable this automatically for a whole module by using `from __future__ import annotations` ({pep}`563`).
In this case *attrs* simply puts these string literals into the `type` attributes.
If you need to resolve these to real types, you can call {func}`attrs.resolve_types` which will update the attribute in place.

In practice though, types show their biggest usefulness in combination with tools like [Mypy], [*pytype*], or [Pyright] that have dedicated support for *attrs* classes.

The addition of static types is certainly one of the most exciting features in the Python ecosystem and helps you write *correct* and *verified self-documenting* code.


## Mypy

While having a nice syntax for type metadata is great, it's even greater that [Mypy] ships with a dedicated *attrs* plugin which allows you to statically check your code.

Imagine you add another line that tries to instantiate the defined class using `SomeClass("23")`.
Mypy will catch that error for you:

```console
$ mypy t.py
t.py:12: error: Argument 1 to "SomeClass" has incompatible type "str"; expected "int"
```

This happens *without* running your code!

And it also works with *both* legacy annotation styles.
To Mypy, this code is equivalent to the one above:

```python
@attr.s
class SomeClass:
    a_number = attr.ib(default=42)  # type: int
    list_of_numbers = attr.ib(factory=list, type=list[int])
```

The approach used for `list_of_numbers` one is only a available in our [old-style API](names.md) which is why the example still uses it.


## Pyright

*attrs* provides support for [Pyright] through the `dataclass_transform` / {pep}`681` specification.
This provides static type inference for a subset of *attrs* equivalent to standard-library {mod}`dataclasses`,
and requires explicit type annotations using the {func}`attrs.define` or `@attr.s(auto_attribs=True)` API.

Given the following definition, Pyright will generate static type signatures for `SomeClass` attribute access, `__init__`, `__eq__`, and comparison methods:

```
@attrs.define
class SomeClass:
    a_number: int = 42
    list_of_numbers: list[int] = attr.field(factory=list)
```

:::{warning}
The Pyright inferred types are a tiny subset of those supported by Mypy, including:

- The `attrs.frozen` decorator is not typed with frozen attributes, which are properly typed via `attrs.define(frozen=True)`.

Your constructive feedback is welcome in both [attrs#795](https://github.com/python-attrs/attrs/issues/795) and [pyright#1782](https://github.com/microsoft/pyright/discussions/1782).
Generally speaking, the decision on improving *attrs* support in Pyright is entirely Microsoft's prerogative and they unequivocally indicated that they'll only add support for features that go through the PEP process, though.
:::


## Class variables and constants

If you are adding type annotations to all of your code, you might wonder how to define a class variable (as opposed to an instance variable), because a value assigned at class scope becomes a default for that attribute.
The proper way to type such a class variable, though, is with {data}`typing.ClassVar`, which indicates that the variable should only be assigned in the class (or its subclasses) and not in instances of the class.
*attrs* will skip over members annotated with {data}`typing.ClassVar`, allowing you to write a type annotation without turning the member into an attribute.
Class variables are often used for constants, though they can also be used for mutable singleton data shared across all instances of the class.

```
@attrs.define
class PngHeader:
    SIGNATURE: typing.ClassVar[bytes] = b'\x89PNG\r\n\x1a\n'
    height: int
    width: int
    interlaced: int = 0
    ...
```

[Mypy]: http://mypy-lang.org
[Pyright]: https://github.com/microsoft/pyright
[*pytype*]: https://google.github.io/pytype/
