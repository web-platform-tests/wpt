import re
from collections import deque

next_char = re.compile(br"[\(\)\[\]\{\},\"\'`]|//|/\*", re.MULTILINE)


def get_args(data, offset=0):
    if not data or data[offset:offset+1] != b"(":
        raise ValueError("Failed to find function args (No leading paren)")
    arg_indicies = []
    remove_indicies = deque([])
    paren_count = 1
    offset += 1
    start_idx = offset
    while paren_count > 0:
        m = next_char.search(data, offset)
        if not m:
            raise ValueError("Failed to find function args (eof before matching all parens)")
        symbol = m.group()
        offset = m.span()[1]
        if symbol in b"([{":
            paren_count += 1
        elif symbol in b")]}":
            paren_count -= 1
        elif symbol == b",":
            if paren_count == 1:
                arg_indicies.append((start_idx, offset - 1))
                start_idx = offset
        elif symbol in (b"//", b"/*"):
            remove_start_idx = offset - len(symbol)
            if symbol == b"//":
                # Various other line end character combinations are also allowed
                end_comment = re.compile(b"\n")
            else:
                end_comment = re.compile(b"\*/")

            end_comment_m = end_comment.search(data, offset)
            if not end_comment_m:
                raise ValueError("Failed to find function args (failed to find end of comment)")

            offset = end_comment_m.span()[1]
            remove_indicies.append((remove_start_idx, offset))
        else:
            # TODO: correct support for ` is harder
            end_quote = re.compile(br"(?<!\\)%s" % symbol, re.MULTILINE)
            quote_m = end_quote.search(data, offset)
            if not quote_m:
                raise ValueError("Failed to find function args (failed to find end of string)")
            offset = quote_m.span()[1]

    arg_indicies.append((start_idx, offset - 1))
    args = []
    for start, end in arg_indicies:
        arg = data[start:end]
        remove_offset = start
        while remove_indicies and start <= remove_indicies[0][0] <= end:
            indicies = remove_indicies.popleft()
            assert indicies[1] <= end
            arg = arg[:indicies[0] - remove_offset] + arg[indicies[1] - remove_offset:]
            remove_offset += indicies[1] - indicies[0]
        arg = arg.strip()
        if arg:
            args.append(arg)

    return args
