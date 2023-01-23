# This script can convert IdnaTestV2.txt to JSON, accounting for the requirements in the
# URL Standard.

import argparse
import json
import os
import re
import requests

def get_IdnaTestV2_lines():
    if not os.path.exists("IdnaTestV2.txt"):
        # Download IdnaTestV2.txt if it doesn't exist yet
        open("IdnaTestV2.txt", "w").write(requests.get("https://unicode.org/Public/idna/latest/IdnaTestV2.txt").text)
    return open("IdnaTestV2.txt", "r").readlines()

def remove_escapes(input):
    return json.loads("\"" + input + "\"")

def ends_in_a_number(input):
    # This method is not robust. It uses https://www.unicode.org/reports/tr46/#Notation but there
    # are likely other ways to end up with a dot, e.g., through decomposition or percent-decoding.
    # It also does not entirely match https://url.spec.whatwg.org/#ends-in-a-number-checker. It
    # appears to suffice for the tests in question though.
    parts = re.split(r"\u002E|\uFF0E|\u3002|\uFF61", input)
    if not parts:
        return False
    if parts[-1] == "":
        if len(parts) == 1:
            return False
        parts.pop()
    return parts[-1].isascii() and parts[-1].isdigit()

def parse(lines, exclude_ipv4_like, exclude_std3_non_ascii):
    # Main quest.
    output = ["THIS IS A GENERATED FILE. PLEASE DO NOT MODIFY DIRECTLY. See IdnaTestV2-parser.py instead."]
    output.append(f"--exclude-ipv4-like: {exclude_ipv4_like}; --exclude-std3-non-ascii: {exclude_std3_non_ascii}")

    # Side quest.
    unique_statuses = []

    for line in lines:
        # Remove newlines
        line = line.rstrip()

        # Remove lines that are comments or empty
        if line.startswith("#") or line == "":
            continue

        # Remove escapes (doesn't handle \x{XXXX} but those do not appear in the source)
        line = remove_escapes(line)

        # Normalize columns
        #
        # Since we are only interested in ToASCII and enforce Transitional_Processing=false we care
        # about the following columns:
        #
        # * Column 1: source
        # * Column 4: toAsciiN
        # * Column 5: toAsciiNStatus
        columns = [column.strip() for column in line.split(";")]

        # Column 1
        column_source = columns[0]

        if exclude_ipv4_like:
            if ends_in_a_number(column_source):
                continue

        if exclude_std3_non_ascii:
            # Notably this does not deal with them appearing in xn-- inputs.
            if re.search(r"\u2260|\u226E|\u226F", column_source):
                continue

        # Column 4 (if empty, use Column 2; if empty again, use Column 1)
        column_to_ascii = columns[3]
        if column_to_ascii == "":
            column_to_ascii = columns[1]
            if column_to_ascii == "":
                column_to_ascii = column_source

        # Column 5 (if empty, use Column 3)
        column_status = columns[4]
        if column_status == "":
            column_status = columns[2]
        # Convert to list
        if column_status == "":
            column_status = []
        else:
            assert column_status.startswith("[")
            column_status = [status.strip() for status in column_status[1:-1].split(",")]

        # Side quest time.
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

        if len(column_status) > 0:
            column_to_ascii = None

        test = { "input": column_source, "output": column_to_ascii }
        if comment != "":
            test["comment"] = comment
        output.append(test)

    unique_statuses.sort()
    return { "tests": output, "unique_statuses": unique_statuses }

def to_json(data):
    handle = open("../resources/IdnaTestV2.json", "w")
    handle.write(json.dumps(data, sort_keys=True, allow_nan=False, indent=2, separators=(',', ': ')))
    handle.write("\n")
    handle.close()

def main():
    parser = argparse.ArgumentParser(epilog="Thanks for caring about IDNA!")
    parser.add_argument("--generate", action="store_true", help="Generate the JSON resource.")
    parser.add_argument("--exclude-ipv4-like", action="store_true", help="Exclude inputs that end with an ASCII digit label. (Not robust.)")
    parser.add_argument("--exclude-std3-non-ascii", action="store_true", help="Exclude inputs containing \u2260, \u226E, or \u226F. (Not robust at all.)")
    parser.add_argument("--statuses", action="store_true", help="Print the unique statuses in IdnaTestV2.txt.")
    args = parser.parse_args()

    if args.generate or args.statuses:
        output = parse(get_IdnaTestV2_lines(), args.exclude_ipv4_like, args.exclude_std3_non_ascii)
        if args.statuses:
            print(output["unique_statuses"])
        else:
            assert args.generate
            to_json(output["tests"])
    else:
        parser.print_usage()

main()
