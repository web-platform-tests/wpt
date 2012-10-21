var browser = (function getBrowser() {
    if (navigator.userAgent.indexOf("WebKit") > 0) {
        return "webkit";
    }
    if (navigator.userAgent.indexOf("Firefox") > 0) {
        return "moz";
    }
    if (navigator.userAgent.indexOf("MSIE") > 0) {
        return "msie";
    }
    if (navigator.userAgent.indexOf("Safari") > 0) {
        return "safari";
    }
    if (navigator.userAgent.indexOf("Camino") > 0) {
        return "camino";
    }
    if (navigator.userAgent.indexOf("Gecko/") > 0) {
        return "gecko";
    }
})();


//get style propoty
function GetCurrentStyle(prop) {
        try
        {
            var div = document.querySelector("#test");   //object
            prop = prop.replace(/([-][a-z])/g, function ($1) { return $1.toUpperCase().replace("-","") });
            var headprop = headProp(prop);
            var fixprop = getComputedStyle(div)[headprop];
            if (!fixprop)
            {return "";}
            return fixprop;
        }
        catch(e)
        {
                return "";
        }
}

//
function headProp(s) {
    var div = document.querySelector("#test");
    if (s in div.style) {
        return s;
    }
    s = s.replace(/([-][a-z])/g, function ($1) { return $1.toUpperCase().replace("-", "") });
    if (s in div.style) {
        return s;
    }
    s = s[0].toUpperCase() + s.slice(1);
    var prefixes = ["ms", "Moz", "moz", "webkit", "O"];
    for (var i = 0; i < prefixes.length; i++) {
        if ((prefixes[i] + s) in div.style) {
            return prefixes[i] + s;
        }
    }
    return s;
}

function getmatrixm(matrix3d,i) {
    var matrix3d = matrix3d.replace("matrix3d(","").replace(")","");
    var m = matrix3d.split(",");
    if (m.length > i) {
        return m[i].replace(" ","");
    }
    return "";
}
