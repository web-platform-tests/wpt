import json, re

hosts = ["# This resource is generated. Please don't edit."]
for cp in xrange(0, 0x7F):
    string = chr(cp)
    host = { "input": string, "output": string, "onlySetters": False }

    if re.match("[a-z]|[A-Z]|[0-9]", string):
        continue

    if string in ("\x09", "\x0A", "\x0D", "?", "/", "\\", ":", "@", "#"):
        host["output"] = None
        host["onlySetters"] = True

    if string in ("\x00", "\x20", "%", "[", "]"):
        host["output"] = None

    hosts.append(host)

handle = open("hosttestdata.json", "w")
handle.write(json.dumps(hosts, sort_keys=True, indent=2, separators=(',', ': ')))
handle.write("\n")
