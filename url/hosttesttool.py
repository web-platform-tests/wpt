import json, re

hosts = ["# This resource is generated. Please don't edit."]
for cp in xrange(0, 0x7F):
    string = chr(cp)
    host = { "input": string, "output": string, "onlySetters": False }

    # Always stripped from input by the parser so better tested elsewhere
    if string in ("\x09", "\x0A", "\x0D"):
        continue

    if re.match("[a-z]", string):
        continue

    if re.match("[A-Z]", string):
        host["output"] = string.lower()

    if re.match("[0-9]", string):
        host["output"] = "0.0.0." + string

    if string in ("?", "/", "\\", ":", "@", "#"):
        host["output"] = None
        host["onlySetters"] = True

    if string in ("\x00", "\x20", "%", "[", "]"):
        host["output"] = None

    hosts.append(host)

handle = open("hosttestdata.json", "w")
handle.write(json.dumps(hosts, sort_keys=True, indent=2, separators=(',', ': ')))
handle.write("\n")
