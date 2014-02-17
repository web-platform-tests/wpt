~// Use this script when you want to test APIs that use vendor prefixes
// and define which objects need to be checked for prefixed versions, à la
// <script src="vendor-prefix.js"
//   data-prefixed-objects='[{"ancestors":["navigator"], "name":"getUserMedia"}]'
// data-prefixed-prototypes='[{"ancestors":["HTMLMediaElement"],"name":"srcObject"}]'></script>
// data-prefixed-objects lets prefix objects in the global space
// data-prefixed-prototypes adds prefixes to interfaces, for objects that
// get created during the tests

// NB: vendor prefixes are expected to go away in favor of putting
// new features behind flag, so hopefully there will be only limited
// need to use this

(function () {
    var aliases = {};
    var doc = document.createElement('div');

    function getParentObject(ancestors) {
        var parent = window;
        ancestors.forEach(function (p) {
            parent = parent[p];
            if (parent[p] === undefined) return;
        });
        return parent;
    }

    function prependPrefix(prefix, name) {
        var newName = name[0].toUpperCase() + name.substr(1, name.length);
        return prefix + newName;
    }

    function setPrototypeAlias(obj) {
        var vendorPrefixes = ["moz", "ms", "o", "webkit"];
        var parent = getParentObject(obj.ancestors);
        if (parent === undefined) return;
        if (!parent.prototype.hasOwnProperty(obj.name)) {
            vendorPrefixes.forEach(function (prefix) {
                if (parent.prototype.hasOwnProperty(prependPrefix(prefix, obj.name))) {
                    Object.defineProperty(parent.prototype, obj.name,
                                          {get: function() {return this[prependPrefix(prefix, obj.name)];},
                                           set: function(v) {console.log(this); this[prependPrefix(prefix, obj.name)] = v;}
                                          });
                    aliases[obj.ancestors.join(".") + ".prototype." + obj.name] = obj.ancestors.join(".") + ".prototype." + prependPrefix(prefix, obj.name);
                    return;
                }
            });
        }
    }

    function setAlias(obj) {
        var vendorPrefixes = ["moz", "ms", "o", "webkit", "Moz", "MS", "O", "Webkit", "op"];
        var parent = getParentObject(obj.ancestors);
        if (parent === undefined) return;
        if (parent[obj.name] === undefined) {
            vendorPrefixes.forEach(function (prefix) {
                if (parent[prependPrefix(prefix, obj.name)] !== undefined) {
                    parent[obj.name] = parent[prependPrefix(prefix, obj.name)];
                    aliases[obj.ancestors.join(".") + "." + obj.name] = obj.ancestors.join(".") + "." + prependPrefix(prefix, obj.name);
                    return;
                }
            });
        }
    }

    if (location.search.indexOf('usePrefixes=1') !== -1) {
        if (document.querySelector("script[data-prefixed-objects]")) {
            var prefixObjectsData = document.querySelector("script[data-prefixed-objects]").dataset["prefixedObjects"];
            try {
                var prefixedObjects = JSON.parse(prefixObjectsData);
            } catch (e) {
                console.log("couldn't parse data-prefixed-objects as JSON:" + e);
            }
            prefixedObjects.forEach(setAlias);
        }
        if (document.querySelector("script[data-prefixed-prototypes]")) {
            var prefixProtoData = document.querySelector("script[data-prefixed-prototypes]").dataset["prefixedPrototypes"];
            try {
                var prefixedPrototypes = JSON.parse(prefixProtoData);
            } catch (e) {
                console.log("couldn't parse data-prefixed-prototypes as JSON:" + e);
            }
            prefixedPrototypes.forEach(setPrototypeAlias);
        }
        var ul = document.createElement("ul");
        Object.keys(aliases).forEach(function (alias) {
            var li = document.createElement("li");
            li.appendChild(document.createTextNode(alias + " has been set to be an alias of vendor-prefixed " + aliases[alias]));
            ul.appendChild(li);
        });
        doc.appendChild(ul);
    } else {
        // Document that the test can be run with prefixes enabled

        var a = document.createElement('a');
        var link = "";
        if (location.search) {
            link = location.search + "&usePrefixes=1";
        } else {
            link = "?usePrefixes=1";
        }
        a.setAttribute("href", link);
        a.appendChild(document.createTextNode("with vendor prefixes enabled"));
        doc.appendChild(document.createTextNode("The feature(s) tested here are known to have been made available via vendor prefixes; you can run this test "));
        doc.appendChild(a);
        doc.appendChild(document.createTextNode("."));
    }
    var log = document.getElementById('log');
    if (log) {
        log.parentNode.insertBefore(doc, log);
    } else {
        body.appendChild(doc);
    }
})();