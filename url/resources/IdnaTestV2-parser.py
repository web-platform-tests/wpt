import os
import json
import requests

if not os.path.exists("IdnaTestV2.txt"):
  # Download IdnaTestV2.txt if it doesn't exist yet
  open("IdnaTestV2.txt", "w").write(requests.get("https://unicode.org/Public/idna/latest/IdnaTestV2.txt").text)

test_input = open("IdnaTestV2.txt", "r").readlines()
test_output = ["This resource is a conversion of IdnaTestV2 aimed to match the requirements of the URL Standard's domain to ASCII"]

def remove_escapes(input):
    return json.loads("\"" + input + "\"")

unique_statuses = []

i = 0
for test in test_input:
    # Remove newlines
    test = test.rstrip()

    # Remove lines from test_input that are comments or empty
    if test.startswith("#") or test == "":
        continue

    # Remove escapes (doesn't handle \x{XXXX} but those do not appear in the source)
    test = remove_escapes(test)

    # Normalize columns
    #
    # Since we are only interested in ToASCII and enforce Transitional_Processing=false we care
    # about the following columns:
    #
    # * Column 1: source
    # * Column 4: toAsciiN
    # * Column 5: toAsciiNStatus
    columns = [column.strip() for column in test.split(";")]

    # Column 1
    column_source = columns[0]

    # Column 4 (if empty, use Column 2; if empty again, use Column 1)
    column_to_ascii = columns[3]
    if column_to_ascii == "":
        column_to_ascii = columns[1]
        if column_to_ascii == "":
            column_to_ascii = column_source

    # Column 5 (if empty, use Column 3; if empty again, assume empty list)
    column_status = columns[4]
    if column_status == "":
        column_status = columns[2]
    if column_status == "":
        column_status = []
    else:
        assert column_status.startswith("[")
        column_status = [status.strip() for status in column_status[1:-1].split(",")]

    for status in column_status:
        if status not in unique_statuses:
            unique_statuses.append(status)

    # The URL Standard has
    #
    # * UseSTD3ASCIIRules=false; however there are no tests marked U1 (some should be though)
    # * CheckHyphens=false; thus ignore V2, V3?
    # * VerifyDnsLength=false; thus ignore A4_1 and A4_2
    comment = ""
    for ignored_status in ["A4_1", "A4_2", "U1", "V2", "V3"]:
        if ignored_status in column_status:
            column_status.remove(ignored_status)
            comment += ignored_status + " (ignored); "
    for status in column_status:
        comment += status + "; "
    if comment != "":
        comment = comment.strip()[:-1]

    output = column_to_ascii
    if len(column_status) > 0:
        output = None

    test_output_entry = { "input": column_source, "output": output }
    if comment != "":
        test_output_entry["comment"] = comment

    test_output.append(test_output_entry)

handle = open("IdnaTestV2.json", "w")
handle.write(json.dumps(test_output, sort_keys=True, allow_nan=False, indent=2, separators=(',', ': ')))
handle.write("\n")

unique_statuses.sort()
print(unique_statuses)
