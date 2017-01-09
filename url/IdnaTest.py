from ftplib import FTP
import os, json

import sys
reload(sys)
sys.setdefaultencoding('utf8')

if not os.path.exists("IdnaTest.txt"):
  # Download IdnaTest.txt via FTP if it doesn't exist yet
  ftp = FTP("ftp.unicode.org")
  ftp.login()
  ftp.retrbinary("RETR /Public/idna/latest/IdnaTest.txt", open("IdnaTest.txt","wb").write)
  ftp.quit()

def decodeString(str):
    i = 0
    str = str.decode("utf-8")
    l = len(str)
    output = ""
    while(i < l):
        if(str[i] == "\\" and str[i+1] == "u"):
            i += 2
            value = ""
            while(str[i] in "0123456789abcdefABCDEF" and len(value) < 4):
                value += str[i]
                i+=1
            output += unichr(int(value, 16))
        else:
            output += str[i]
            i+= 1
    return output

tests = open("IdnaTest.txt", "r").readlines()

hosts = ["# This resource is generated. Please don't edit."]
for test in tests:
    if not test[0] in ("B", "T"): # Change T to N when we want IDNA2008
        continue

    testPart = decodeString(test.split("#")[0])

    testParts = testPart.split(";")

    input = testParts[1].strip()
    outputUnicode = testParts[2].strip()
    output = testParts[3].strip()

    if outputUnicode == "":
        outputUnicode = input

    if output == "":
        output = outputUnicode

    if output[0] == "[":
        output = None

    hosts.append({ "input": input, "output": output })

handle = open("IdnaTest.json", "w")
handle.write(json.dumps(hosts, sort_keys=True, indent=2, separators=(',', ': ')))
handle.write("\n")
