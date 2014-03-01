#!/usr/bin/python
template = """<!DOCTYPE html>
<meta charset=utf-8>
<title>Registered extensions to the predefined set of metadata names must be
considered valid and must be compared in an ASCII case-insensitive manner</title>
"""
f = open("meta-extensions", 'r')
for line in f:
  template += '<meta name="%s" content>\n' % line.rstrip('\n')
  template += '<meta name="%s" content>\n' % line.upper().rstrip('\n')
  odd = True
  mixed = ""
  for c in line.rstrip('\n'):
    if odd:
      mixed += c.upper()
    else:
      mixed += c
    odd = not odd
  template += '<meta name="%s" content>\n' % mixed
o = open("registered-names-isvalid.html", 'wb')
o.write(template)
o.close()
