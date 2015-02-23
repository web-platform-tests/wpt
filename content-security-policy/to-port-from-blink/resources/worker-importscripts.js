try {
    importScripts("http://localhost:8000/security/contentSecurityPolicy/resources/post-message.js");
    postMessage("importScripts allowed");
} catch(e) {
    postMessage("importScripts blocked: " + e);
}

