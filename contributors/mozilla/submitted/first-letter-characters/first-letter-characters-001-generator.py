#!/usr/bin/python

# This script authored by L. David Baron (Mozilla Corporation)

import re
from urllib import urlopen

isSurrogateOrPUA = re.compile('^<.*(Private Use|Surrogate).*>$').search

def isValidXMLChar(charcode):
  return (charcode == 0x9) or \
         (charcode  == 0xA) or \
         (charcode == 0xD) or \
         (charcode >= 0x20 and charcode <= 0xD7FF) or \
         (charcode >= 0xE000 and charcode <= 0xFFFD) or \
         (charcode >= 0x10000 and charcode <= 0x10FFFF)

isPunctuation = re.compile('^P(s|e|i|f|o)$').search

charinf = { 'number': 0 }

def print_info(charcode, ispunct):
    printbr = False
    if charinf['number'] == 256:
        charinf['number'] = 0
        printbr = True
    charinf['number'] = charinf['number'] + 1
    if ispunct:
        classname = "extend"
    else:
        classname = "dontextend"
    start = ">"
    if printbr:
        start = start + "</div><div>"
    print start + "<div class=\"test " + classname + "\"><div>&#x" + \
          hex(charcode)[2:] + ";C<span class=\"spacer\"></span></div></div"

# http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
unicodedb = urlopen("http://www.unicode.org/Public/UNIDATA/UnicodeData.txt")
rangefirst = None
print "<div"
for line in unicodedb:
    fields = line.split(";")
    charcode = int(fields[0], 16)
    charname = fields[1]
    ispunct = isPunctuation(fields[2])
    if isSurrogateOrPUA(charname) or not isValidXMLChar(charcode):
        pass
    elif charname.endswith(", First>"):
        if rangefirst != None:
            raise SyntaxError
        rangefirst = charcode
    elif charname.endswith(", Last>"):
        if rangefirst == None:
            raise SyntaxError
        for c in range(rangefirst, charcode + 1):
            print_info(c, ispunct)
        rangefirst = None
    else:
        if rangefirst != None:
            raise SyntaxError
        print_info(charcode, ispunct)
print "></div>"
