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
