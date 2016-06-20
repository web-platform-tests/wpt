 var gbCPs = []  // index is unicode cp, value is pointer
	 for (var p=0;p<gb18030.length;p++) {
		if (gb18030[p] != null && gbCPs[gb18030[p]] == null) {
			gbCPs[gb18030[p]] = p
			}
 	}

var gb18030Ranges = [[0,128],[36,165],[38,169],[45,178],[50,184],[81,216],[89,226],[95,235],[96,238],[100,244],[103,248],[104,251],[105,253],[109,258],[126,276],[133,284],[148,300],[172,325],[175,329],[179,334],[208,364],[306,463],[307,465],[308,467],[309,469],[310,471],[311,473],[312,475],[313,477],[341,506],[428,594],[443,610],[544,712],[545,716],[558,730],[741,930],[742,938],[749,962],[750,970],[805,1026],[819,1104],[820,1106],[7922,8209],[7924,8215],[7925,8218],[7927,8222],[7934,8231],[7943,8241],[7944,8244],[7945,8246],[7950,8252],[8062,8365],[8148,8452],[8149,8454],[8152,8458],[8164,8471],[8174,8482],[8236,8556],[8240,8570],[8262,8596],[8264,8602],[8374,8713],[8380,8720],[8381,8722],[8384,8726],[8388,8731],[8390,8737],[8392,8740],[8393,8742],[8394,8748],[8396,8751],[8401,8760],[8406,8766],[8416,8777],[8419,8781],[8424,8787],[8437,8802],[8439,8808],[8445,8816],[8482,8854],[8485,8858],[8496,8870],[8521,8896],[8603,8979],[8936,9322],[8946,9372],[9046,9548],[9050,9588],[9063,9616],[9066,9622],[9076,9634],[9092,9652],[9100,9662],[9108,9672],[9111,9676],[9113,9680],[9131,9702],[9162,9735],[9164,9738],[9218,9793],[9219,9795],[11329,11906],[11331,11909],[11334,11913],[11336,11917],[11346,11928],[11361,11944],[11363,11947],[11366,11951],[11370,11956],[11372,11960],[11375,11964],[11389,11979],[11682,12284],[11686,12292],[11687,12312],[11692,12319],[11694,12330],[11714,12351],[11716,12436],[11723,12447],[11725,12535],[11730,12543],[11736,12586],[11982,12842],[11989,12850],[12102,12964],[12336,13200],[12348,13215],[12350,13218],[12384,13253],[12393,13263],[12395,13267],[12397,13270],[12510,13384],[12553,13428],[12851,13727],[12962,13839],[12973,13851],[13738,14617],[13823,14703],[13919,14801],[13933,14816],[14080,14964],[14298,15183],[14585,15471],[14698,15585],[15583,16471],[15847,16736],[16318,17208],[16434,17325],[16438,17330],[16481,17374],[16729,17623],[17102,17997],[17122,18018],[17315,18212],[17320,18218],[17402,18301],[17418,18318],[17859,18760],[17909,18811],[17911,18814],[17915,18820],[17916,18823],[17936,18844],[17939,18848],[17961,18872],[18664,19576],[18703,19620],[18814,19738],[18962,19887],[19043,40870],[33469,59244],[33470,59336],[33471,59367],[33484,59413],[33485,59417],[33490,59423],[33497,59431],[33501,59437],[33505,59443],[33513,59452],[33520,59460],[33536,59478],[33550,59493],[37845,63789],[37921,63866],[37948,63894],[38029,63976],[38038,63986],[38064,64016],[38065,64018],[38066,64021],[38069,64025],[38075,64034],[38076,64037],[38078,64042],[39108,65074],[39109,65093],[39113,65107],[39114,65112],[39115,65127],[39116,65132],[39265,65375],[39394,65510],[189000,65536]]


function getRangePtr (cp) {
	if (cp == 0xE7C7) return 7457
	var offset = 128
	var ptrOffset = 0
	if (cp > 128 && cp < 65536) {
		for (var i=0;i<gb18030Ranges.length;i++) {
			if (gb18030Ranges[i][1] > cp) {
				offset = gb18030Ranges[i-1][1]
				ptrOffset = gb18030Ranges[i-1][0]
				break
				}
			}
		return ptrOffset + cp - offset
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


function gbIndexEncoder (stream) {  // this function is used when you just want to encode index characters
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
		if (cp == 0xE5E5) { 
			return null
//			out += ' &#'+cp+';'
//			continue
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
		return null
		}
	return out.trim()
	}


//function gbEncoder (stream, gbk) {
function gbEncoder (stream) {  // this function is used for encoding non-index characters
	var gbk = false
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
		ptr = gbCPs[cp]
		if (ptr != null) {
			return null
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
		if (str.charAt(c) == '%' && str.charAt(c+1) != '%' && str.charAt(c+2) != '%') {
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
