 var gbCPs = []  // index is unicode cp, value is pointer
	 for (var p=0;p<gb18030.length;p++) {
		if (gb18030[p] != null && gbCPs[gb18030[p]] == null) {
			gbCPs[gb18030[p]] = p
			}
 	}

function chars2cps ( chars ) { 
	// this is needed because of javascript's handling of supplementary characters
	// char: a string of unicode characters
	// returns an array of decimal code point values
	var haut = 0
	var out = []
	for (var i = 0; i < chars.length; i++) {
		var b = chars.charCodeAt(i)
		if (b < 0 || b > 0xFFFF) {
			alert( 'Error in chars2cps: byte out of range ' + b.toString(16) + '!' )
			}
		if (haut != 0) {
			if (0xDC00 <= b && b <= 0xDFFF) {
				out.push(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00))
				haut = 0
				continue
				}
			else {
				alert( 'Error in chars2cps: surrogate out of range ' + haut.toString(16) + '!' )
				haut = 0
				}
			}
		if (0xD800 <= b && b <= 0xDBFF) {
			haut = b
			}
		else {
			out.push( b )
			}
		}
	return out
	}


//function gbEncoder (stream, gbk) {
function gbEncoder (stream) {
	var gbk = true
	var cps = chars2cps(stream)
	var out = ''
	var lead, trail, ptr, offset, end, byte1, byte2, byte3, byte4
	var endofstream = 2000000
	var finished = false
	var cp
	
	while (!finished) {
		if (cps.length == 0) cp = endofstream
		else cp = cps.shift()
		
		if (cp == endofstream) { finished = true; continue }
		if (cp >= 0x00 && cp <= 0x7F) {  // ASCII
			out +=  ' '+cp.toString(16).toUpperCase()
			continue
			}
		if (cp == 0xE5E5) {  // ASCII
			return null
//			out += ' &#'+cp+';'
//			continue
			}
		if (gbk && cp == 0x20AC) {
			out += ' 80'
			continue
			}
		var ptr = gbCPs[cp]
		if (ptr != null) {
			lead = Math.floor(ptr/190) + 0x81
			trail = (ptr % 190)
			if (trail < 0x3F) offset = 0x40
			else offset = 0x41
			end = trail + offset
			out += ' '+lead.toString(16).toUpperCase()+' '+end.toString(16).toUpperCase()
			continue
			}
		if (gbk) {
			return null
//			out += ' &#'+cp+';'
//			continue
			}
		ptr = getRangePtr(cp)
		byte1 = Math.floor(ptr / 10 /126 /10)
		ptr = ptr - byte1 * 10 * 126 * 10
		byte2 = Math.floor(ptr / 10 /126)
		ptr = ptr - byte2 * 10 * 126
		byte3 = Math.floor(ptr / 10)
		byte4 = ptr - byte3 * 10
		byte1 += 0x81
		byte2 += 0x30
		byte3 += 0x81
		byte4 += 0x30
		out += ' '+byte1.toString(16).toUpperCase()+' '+byte2.toString(16).toUpperCase()+' '+byte3.toString(16).toUpperCase()+' '+byte4.toString(16).toUpperCase()
		}
	return out.trim()
	}


function convertToHex (str) {
	// converts a string of ASCII characters to hex byte codes
	var out = ''
	var result
	for (var c=0;c<str.length;c++) {
		result = str.charCodeAt(c).toString(16).toUpperCase() + ' '
        out += result
		}
	return out
	}


function normalizeStr ( str ) {
	var out = ''
	for (var c=0;c<str.length;c++) {
		if (str.charAt(c) == '%') {
			out += String.fromCodePoint(parseInt(str.charAt(c+1)+str.charAt(c+2),16))
			c += 2
			}
		else out += str.charAt(c)
		}
	var result = ''
	for (var o=0;o<out.length;o++) {
		result += '%'+out.charCodeAt(o).toString(16).toUpperCase()
		}
	return result.replace(/%1B%28%42$/,'')
	}
