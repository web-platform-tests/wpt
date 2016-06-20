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


var gb18030Ranges = [[0,128],[36,165],[38,169],[45,178],[50,184],[81,216],[89,226],[95,235],[96,238],[100,244],[103,248],[104,251],[105,253],[109,258],[126,276],[133,284],[148,300],[172,325],[175,329],[179,334],[208,364],[306,463],[307,465],[308,467],[309,469],[310,471],[311,473],[312,475],[313,477],[341,506],[428,594],[443,610],[544,712],[545,716],[558,730],[741,930],[742,938],[749,962],[750,970],[805,1026],[819,1104],[820,1106],[7922,8209],[7924,8215],[7925,8218],[7927,8222],[7934,8231],[7943,8241],[7944,8244],[7945,8246],[7950,8252],[8062,8365],[8148,8452],[8149,8454],[8152,8458],[8164,8471],[8174,8482],[8236,8556],[8240,8570],[8262,8596],[8264,8602],[8374,8713],[8380,8720],[8381,8722],[8384,8726],[8388,8731],[8390,8737],[8392,8740],[8393,8742],[8394,8748],[8396,8751],[8401,8760],[8406,8766],[8416,8777],[8419,8781],[8424,8787],[8437,8802],[8439,8808],[8445,8816],[8482,8854],[8485,8858],[8496,8870],[8521,8896],[8603,8979],[8936,9322],[8946,9372],[9046,9548],[9050,9588],[9063,9616],[9066,9622],[9076,9634],[9092,9652],[9100,9662],[9108,9672],[9111,9676],[9113,9680],[9131,9702],[9162,9735],[9164,9738],[9218,9793],[9219,9795],[11329,11906],[11331,11909],[11334,11913],[11336,11917],[11346,11928],[11361,11944],[11363,11947],[11366,11951],[11370,11956],[11372,11960],[11375,11964],[11389,11979],[11682,12284],[11686,12292],[11687,12312],[11692,12319],[11694,12330],[11714,12351],[11716,12436],[11723,12447],[11725,12535],[11730,12543],[11736,12586],[11982,12842],[11989,12850],[12102,12964],[12336,13200],[12348,13215],[12350,13218],[12384,13253],[12393,13263],[12395,13267],[12397,13270],[12510,13384],[12553,13428],[12851,13727],[12962,13839],[12973,13851],[13738,14617],[13823,14703],[13919,14801],[13933,14816],[14080,14964],[14298,15183],[14585,15471],[14698,15585],[15583,16471],[15847,16736],[16318,17208],[16434,17325],[16438,17330],[16481,17374],[16729,17623],[17102,17997],[17122,18018],[17315,18212],[17320,18218],[17402,18301],[17418,18318],[17859,18760],[17909,18811],[17911,18814],[17915,18820],[17916,18823],[17936,18844],[17939,18848],[17961,18872],[18664,19576],[18703,19620],[18814,19738],[18962,19887],[19043,40870],[33469,59244],[33470,59336],[33471,59367],[33484,59413],[33485,59417],[33490,59423],[33497,59431],[33501,59437],[33505,59443],[33513,59452],[33520,59460],[33536,59478],[33550,59493],[37845,63789],[37921,63866],[37948,63894],[38029,63976],[38038,63986],[38064,64016],[38065,64018],[38066,64021],[38069,64025],[38075,64034],[38076,64037],[38078,64042],[39108,65074],[39109,65093],[39113,65107],[39114,65112],[39115,65127],[39116,65132],[39265,65375],[39394,65510],[189000,65536],[2000000,2000000]]


function getRangeCP (ptr) {
	if ((ptr > 39419 && ptr < 189000) || ptr > 1237575) return null
	var offset
	var cpOffset
	for (var i=0;i<gb18030Ranges.length;i++) {
		if (gb18030Ranges[i][0] > ptr) {
			offset = gb18030Ranges[i-1][0]
			cpOffset = gb18030Ranges[i-1][1]
			break
			}
		}
	return cpOffset + ptr - offset
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
	var finished = false

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
