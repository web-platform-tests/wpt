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


function gbDecoder (stream) {
	stream = stream.replace(/%/g,' ')
	stream = stream.replace(/[\s]+/g,' ').trim()
	var bytes = stream.split(' ')
	for (i=0;i<bytes.length;i++) bytes[i] = parseInt(bytes[i],16)
	var out = ''
	var lead, byte, offset, ptr, cp
	var first = 0x00
	var second = 0x00
	var third = 0x00
	var endofstream = 2000000
	finished = false

	while (!finished) {
		if (bytes.length == 0) byte = endofstream
		else var byte = bytes.shift()
		
		if (byte == endofstream && first == 0x00 && second == 0x00 && third == 0x00) {
			finished = true
			break
			}
		if (byte == endofstream && (first != 0x00 || second != 0x00 || third != 0x00)) {
			first = 0x00
			second = 0x00
			third = 0x00
			out += '\uFFFD'
			continue
			}
		if (third != 0x00) {
			cp = null
			if (byte >= 0x30 && byte <= 0x39) {
				cp = getRangeCP((((first - 0x81) * 10 + second - 0x30) * 126 + third - 0x81) *10 + byte - 0x30)
				}
			buffer = [second, third, byte]
			first = 0x00
			second = 0x00
			third = 0x00
			if (cp == null) {
				bytes.unshift(buffer[2])
				bytes.unshift(buffer[1])
				bytes.unshift(buffer[0])
				out += '\uFFFD'
				continue
				}
			out += dec2char(cp)
			continue
			}
		if (second != 0x00) {	
			if (byte >= 0x81 && byte <= 0xFE) {
				third = byte
				continue
				}
			bytes.unshift(byte)
			bytes.unshift(second)
			first = 0x00
			second = 0x00
			out += '\uFFFD'
			continue
			}
		if (first != 0x00) {
			if (byte >= 0x30 && byte <= 0x39) {
				second = byte
				continue
				}
			lead = first
			ptr = null
			first = 0x00
			if (byte < 0x7F) offset = 0x40
			else offset = 0x41
			if ((byte >= 0x40 && byte <= 0x7E) || (byte >= 0x80 && byte <= 0xFE)) ptr = (lead - 0x81) * 190 + (byte - offset)
			if (ptr == null) cp = null
			else cp = gb18030[ptr]
			if (cp == null && byte >= 0x00 && byte <= 0x7F) bytes.unshift(byte)
			if (cp == null) { 
				out += '\uFFFD'
				continue
				}
			out += dec2char(cp)
			continue
			}
		if (byte >= 0x00 && byte <= 0x7F) {
			out += dec2char(byte)
			continue
			}
		if (byte == 0x80) {
			out += dec2char(0x20AC)
			continue
			}
		if (byte >= 0x81 && byte <= 0xFE) {
			first = byte
			continue
			}
		out += '\uFFFD'
		}
	return out
	}
