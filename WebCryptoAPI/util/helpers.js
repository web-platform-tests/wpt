//
// helpers.js
//
// Helper functions used by several WebCryptoAPI tests
//

function runningInASecureContext() {
    var protocol = location.protocol.toLowerCase();
    var hostname = location.hostname.toLowerCase();

    if (["https:", "wss:", "file:"].includes(protocol)) {
        return true;
    }

    if (hostname === "localhost") {
        return true;
    }

    if (/^127\.\d+\.\d+\.\d+$/.test(hostname)) {
        return true;
    }

    if (/^(0:){7}1$/.test(hostname) || /^::1$/.test(hostname)) {
        return true;
    }

    return false;
}


// Treats an array as a set, and generates an array of all non-empty
// subsets (which are themselves arrays).
//
// The order of members of the "subsets" is not guaranteed.
function allNonemptySubsetsOf(arr) {
    var results = [];
    var firstElement;
    var remainingElements;

    for(var i=0; i<arr.length; i++) {
        firstElement = arr[i];
        remainingElements = arr.slice(i+1);
        results.push([firstElement]);

        if (remainingElements.length > 0) {
            allNonemptySubsetsOf(remainingElements).forEach(function(combination) {
                combination.push(firstElement);
                results.push(combination);
            });
        }
    }

    return results;
}
