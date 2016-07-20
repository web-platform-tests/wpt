/* $Date: 2007-06-12 18:02:31 $ */

// from: http://bannister.us/weblog/2007/06/09/simple-base64-encodedecode-javascript/
// Handles encode/decode of ASCII and Unicode strings.

var UTF8 = {};
UTF8.encode = function(s) {
    var u = [];
    for (var i = 0; i < s.length; ++i) {
        var c = s.charCodeAt(i);
        if (c < 0x80) {
            u.push(c);
        } else if (c < 0x800) {
            u.push(0xC0 | (c >> 6));
            u.push(0x80 | (63 & c));
        } else if (c < 0x10000) {
            u.push(0xE0 | (c >> 12));
            u.push(0x80 | (63 & (c >> 6)));
            u.push(0x80 | (63 & c));
        } else {
            u.push(0xF0 | (c >> 18));
            u.push(0x80 | (63 & (c >> 12)));
            u.push(0x80 | (63 & (c >> 6)));
            u.push(0x80 | (63 & c));
        }
    }
    return u;
};
UTF8.decode = function(u) {
    var a = [];
    var i = 0;
    while (i < u.length) {
        var v = u[i++];
        if (v < 0x80) {
            // no need to mask byte
        } else if (v < 0xE0) {
            v = (31 & v) << 6;
            v |= (63 & u[i++]);
        } else if (v < 0xF0) {
            v = (15 & v) << 12;
            v |= (63 & u[i++]) << 6;
            v |= (63 & u[i++]);
        } else {
            v = (7 & v) << 18;
            v |= (63 & u[i++]) << 12;
            v |= (63 & u[i++]) << 6;
            v |= (63 & u[i++]);
        }
        a.push(String.fromCharCode(v));
    }
    return a.join('');
};

var BASE64 = {};
(function(T){
    var encodeArray = function(u) {
        var i = 0;
        var a = [];
        var n = 0 | (u.length / 3);
        while (0 < n--) {
            var v = (u[i] << 16) + (u[i+1] << 8) + u[i+2];
            i += 3;
            a.push(T.charAt(63 & (v >> 18)));
            a.push(T.charAt(63 & (v >> 12)));
            a.push(T.charAt(63 & (v >> 6)));
            a.push(T.charAt(63 & v));
        }
        if (2 == (u.length - i)) {
            var v = (u[i] << 16) + (u[i+1] << 8);
            a.push(T.charAt(63 & (v >> 18)));
            a.push(T.charAt(63 & (v >> 12)));
            a.push(T.charAt(63 & (v >> 6)));
            a.push('=');
        } else if (1 == (u.length - i)) {
            var v = (u[i] << 16);
            a.push(T.charAt(63 & (v >> 18)));
            a.push(T.charAt(63 & (v >> 12)));
            a.push('==');
        }
        return a.join('');
    }
    var R = (function(){
        var a = [];
        for (var i=0; i<T.length; ++i) {
            a[T.charCodeAt(i)] = i;
        }
        a['='.charCodeAt(0)] = 0;
        return a;
    })();
    var decodeArray = function(s) {
        var i = 0;
        var u = [];
        var n = 0 | (s.length / 4);
        while (0 < n--) {
            var v = (R[s.charCodeAt(i)] << 18) + (R[s.charCodeAt(i+1)] << 12) + (R[s.charCodeAt(i+2)] << 6) + R[s.charCodeAt(i+3)];
            u.push(255 & (v >> 16));
            u.push(255 & (v >> 8));
            u.push(255 & v);
            i += 4;
        }
        if (u) {
            if ('=' == s.charAt(i-2)) {
                u.pop();
                u.pop();
            } else if ('=' == s.charAt(i-1)) {
                u.pop();
            }
        }
        return u;
    }
    var ASCII = {};
    ASCII.encode = function(s) {
        var u = [];
        for (var i = 0; i<s.length; ++i) {
            u.push(s.charCodeAt(i));
        }
        return u;
    };
    ASCII.decode = function(u) {
        for (var i = 0; i<s.length; ++i) {
            a[i] = String.fromCharCode(a[i]);
        }
        return a.join('');
    };
    BASE64.decodeArray = function(s) {
        var u = decodeArray(s);
        return new Uint8Array(u);
    };
    BASE64.encodeASCII = function(s) {
        var u = ASCII.encode(s);
        return encodeArray(u);
    };
    BASE64.decodeASCII = function(s) {
        var a = decodeArray(s);
        return ASCII.decode(a);
    };
    BASE64.encode = function(s) {
        var u = UTF8.encode(s);
        return encodeArray(u);
    };
    BASE64.decode = function(s) {
        var u = decodeArray(s);
        return UTF8.decode(u);
    };
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

/*The following polyfills are not used in dash.js but have caused multiplayer integration issues.
 Therefore commenting them out.
if (undefined === btoa) {
    var btoa = BASE64.encode;
}
if (undefined === atob) {
    var atob = BASE64.decode;
}
*/

if (typeof exports !== 'undefined') {
    exports.decode = BASE64.decode;
    exports.decodeArray = BASE64.decodeArray;
}
