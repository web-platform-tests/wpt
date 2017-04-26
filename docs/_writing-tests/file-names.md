---
layout: page
title: File Name Flags
order: 2
---

The test filename is significant in determining the type of test it
contains, and enabling specific optional features. This page documents
the various flags avaiable and their meaning.

### Test Type

These flags must be the last element in the filename before the
extension e.g. `foo-manual.html` will indicate a manual test, but
`foo-manual-other.html` will not.

<dl>
  <dt>`-manual`
  <dd><p>Indicates that a test is a non-automated test.
  <dt>`-support`
  <dd><p>Indicates that a file is not a test but a support file.
  <dt>`-visual`
  <dd><p>Indicates that a file is a visual test.
</dl>

### Test Features

<dl>
  <dt>`.https`
  <dd><p>Indicates that a test is loaded over https
  <dt>`.sub`
  <dd><p>Indicates that a test uses the server-side substitution
         feature.
  <dt>`.window`
  <dd><p>(js files only) Indicates that the file generates a test in
  which it is run in a Window environment.
  <dt>`.worker`
  <dd><p>(js files only) Indicates that the file generates a test in
  which it is run in a decicated worker environment.
  <dt>`.any`
  <dd><p>(js files only) Indicates that the file generates tests in
  which it is run in Window and decicated worker environments.
</dl>
