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


function sjisDecoder (stream) {
	stream = stream.replace(/%/g,' ')
	stream = stream.replace(/[\s]+/g,' ').trim()
	var bytes = stream.split(' ')
	for (i=0;i<bytes.length;i++) bytes[i] = parseInt(bytes[i],16)
	var out = ''
	var lead, byte, leadoffset, offset, ptr, cp
	var sjisLead = 0x00
	var endofstream = 2000000
	var finished = false
	
	while (!finished) {
		if (bytes.length == 0) byte = endofstream
		else byte = bytes.shift()	

		if (byte == endofstream && sjisLead != 0x00) {
			sjisLead = 0x00
			out += '�'
			continue
			}
		if (byte == endofstream && sjisLead == 0x00) {
			finished = true
			continue
			}
		if (sjisLead != 0x00) {	
			lead = sjisLead
			ptr = null
			sjisLead = 0x00
			if (byte < 0x7F) offset = 0x40
			else offset = 0x41
			if (lead < 0xA0) leadoffset = 0x81
			else leadoffset = 0xC1
			if ((byte >= 0x40 && byte <= 0x7E) || (byte >= 0x80 && byte <= 0xFC)) ptr = (lead - leadoffset) * 188 + byte - offset
			if (cp == null && ptr >= 8836 && ptr <= 10528) {
				out += dec2char(0xE000 + ptr - 8836)
				continue
				}
			if (ptr == null) cp = null
			else cp = jis0208[ptr]
			if (cp == null && byte >= 0x00 && byte <= 0x7F) {
				bytes.unshift(byte)
				}
			if (cp == null) { 
				out += '�'
				continue
				}
			out += dec2char(cp)
			continue
			}
		if ((byte >= 0x00 && byte <= 0x7F) || byte == 0x80) {
			out += dec2char(byte)
			continue
			}
		if (byte >= 0xA1 && byte <= 0xDF) {
			out += dec2char(0xFF61 + byte - 0xA1)
			continue
			}
		if ((byte >= 0x81 && byte <= 0x9F) || (byte >= 0xE0 && byte <= 0xFC)) {
			sjisLead = byte
			continue
			}
		out += '�'
		}
	return out
	}
