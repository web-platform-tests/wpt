function dec2char ( n ) {
	// converts a decimal number to a Unicode character
	// n: the dec codepoint value to be converted
    if (n <= 0xFFFF) { out = String.fromCharCode(n) }
	else if (n <= 0x10FFFF) {
		n -= 0x10000
		out = String.fromCharCode(0xD800 | (n >> 10)) + String.fromCharCode(0xDC00 | (n & 0x3FF))
    	}
	else out = 'dec2char error: Code point out of range: '+n
	return out
	}


function big5Decoder (stream) {
	stream = stream.replace(/%/g,' ')
	stream = stream.replace(/[\s]+/g,' ').trim()
	var bytes = stream.split(' ')
	for (i=0;i<bytes.length;i++) bytes[i] = parseInt(bytes[i],16)
	var out = ''
	var lead, byte, offset, ptr, cp
	var big5lead = 0x00
	var endofstream = 2000000
	var finished = false

	while (!finished) {
		if (bytes.length == 0) byte = endofstream
		else byte = bytes.shift()

		if (byte == endofstream && big5lead != 0x00) {
			big5lead = 0x00
			out += '�'
			continue
			}
		if (byte == endofstream && big5lead == 0x00) { finished = true; continue }

		if (big5lead != 0x00) {
			lead = big5lead
			ptr = null
			big5lead = 0x00
			if (byte < 0x7F) offset = 0x40
			else offset = 0x62
			if ((byte >= 0x40 && byte <= 0x7E) || (byte >= 0xA1 && byte <= 0xFE)) ptr = (lead - 0x81) * 157 + (byte - offset)
			// "If there is a row in the table below whose first column is pointer, return the two code points listed in its second column"
			switch (ptr) {
				case '1133': out += 'Ê̄'; continue
				case '1135': out += 'Ê̌'; continue
				case '1164': out += 'ê̄'; continue
				case '1166': out += 'ê̌'; continue
				}
			if (ptr == null) cp = null
			else cp = big5[ptr]
			if (cp == null && byte >= 0x00 && byte < 0x7F) { bytes.unshift(byte); continue }
			if (cp == null) {
				out += '�'
				continue
				}
			out += dec2char(cp)
			continue
			}
		if (byte >= 0x00 && byte < 0x7F) { out += dec2char(byte); continue }
		if (byte >= 0x81 && byte <= 0xFE) { big5lead = byte; continue }
		out += '�'
		}
	return out
	}
