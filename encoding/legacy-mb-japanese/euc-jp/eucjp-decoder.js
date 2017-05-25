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


function eucjpDecoder (stream) {
	stream = stream.replace(/%/g,' ')
	stream = stream.replace(/[\s]+/g,' ').trim()
	var bytes = stream.split(' ')
	for (i=0;i<bytes.length;i++) bytes[i] = parseInt(bytes[i],16)
	var out = ''
	var lead, byte, offset, ptr, cp
	var jis0212flag = false
	var eucjpLead = 0x00
	var endofstream = 2000000
	var finished = false
	
	while (!finished) {
		if (bytes.length == 0) byte = endofstream
		else byte = bytes.shift()	

		if (byte == endofstream && eucjpLead != 0x00) {
			eucjpLead = 0x00
			out += '�'
			continue
			}
		if (byte == endofstream && eucjpLead == 0x00) {
			finished = true
			continue
			}
		if (eucjpLead == 0x8E && byte >= 0xA1 && byte <= 0xDF) {	
			eucjpLead = 0x00
			out += dec2char(0xFF61 + byte - 0xA1)
			continue
			}
		if (eucjpLead == 0x8F && byte >= 0xA1 && byte <= 0xFE) {	
			jis0212flag = true
			eucjpLead = byte
			continue
			}
		if (eucjpLead != 0x00) {	
			lead = eucjpLead
			eucjpLead = 0x00
			cp = null
	
			if ((lead >= 0xA1 && lead <= 0xFE) && (byte >= 0xA1 && byte <= 0xFE)) {
				ptr = (lead - 0xA1) * 94 + byte - 0xA1
				if (jis0212flag) cp = jis0212[ptr]
				else cp = jis0208[ptr]
				}
			jis0212flag = false
			if (byte < 0xA1 || byte > 0xFE) bytes.unshift(byte)
			if (cp == null) { 
				out += '�'
				continue
				}
			out += dec2char(cp)
			continue
			}
		if (byte >= 0x00 && byte <= 0x7F) { out += dec2char(byte); continue }
		if (byte == 0x8E || byte == 0x8F || (byte >= 0xA1 && byte <= 0xFE)) { eucjpLead = byte; continue }
		out += '�'
		}
	return out
	}
