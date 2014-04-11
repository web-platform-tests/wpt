# -*- coding: utf-8 -*-
template = """<!DOCTYPE html>
<meta charset=utf-8>
<title>Registered extensions to the predefined set of metadata names</title>
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
o = open("names-registered-isvalid.html", 'wb')
o.write(template)
o.close()

errors = {
  "turkish-lowercase-dotless-i": "applıcatıon-name",
  "turkish-uppercase-dotted-i": "APPLİCATİON-NAME",
  "leading-whitespace": " keywords",
  "trailing-whitespace": "keywords ",
  "trailing-u0000": "description&#x0000;",
  "trailing-pile-of-poo": "description💩",
  "leading-bom": "﻿generator",
  "empty": "",
  "rejected-cache": "cache",
  "rejected-no-email-collection": "no-email-collection",
}
for key in errors.keys():
  template = "<!DOCTYPE html>\n<meta charset=utf-8>\n"
  template += "<title>name-%s</title>" % key
  template += '<meta name="%s" content>\n' % errors[key]
  o = open("name-%s-novalid.html" % key, 'wb')
  o.write(template)
  o.close()
