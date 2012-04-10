var __SERVER__NAME = "w3c-test.org";
var __PORT = 8080;
var __SECURE__PORT = 8443;
// NOT ENABLED, NOT NEEDED AT THIS TIME
var __NEW__PORT = 8081;
// NOT ENABLED, NOT NEEDED AT THIS TIME
var __NEW__SECURE__PORT = 8444;
var __PATH = "echo";
var __PROTOCOL = "echo";
var __PROTOCOLS = ["echo", "chat"];
var __REPEATED__PROTOCOLS = ["echo", "echo"];
var __URL;
var __IS__WEBSOCKET;
var __PASS = "Pass";
var __FAIL = "Fail";
var wsocket;
var data;
var timeOut;
var defaultTimeout = 12000;

function IsWebSocket() {
    if (!window.WebSocket) {
        BrowserDoesNotSupportWebSocket();
    }

    timeOut = setTimeout(OnTimeOutFail, defaultTimeout);
}

function CreateWebSocketNonAbsolute() {
    IsWebSocket();
    __URL = __SERVER__NAME;
    wsocket = new WebSocket(__URL);
}

function CreateWebSocketNonWsScheme() {
    IsWebSocket();
    __URL = "http://" + __SERVER__NAME + ":" + __PORT + "/" + __PATH;
    wsocket = new WebSocket(__URL);
}

function CreateWebSocketNonAsciiProtocol(nonAsciiProtocol) {
    IsWebSocket();
    __URL = "ws://" + __SERVER__NAME + ":" + __PORT + "/" + __PATH;
    wsocket = new WebSocket(__URL, nonAsciiProtocol);
}

function CreateWebSocketWithBlockedPort(blockedPort) {
    IsWebSocket();
    __URL = "wss://" + __SERVER__NAME + ":" + blockedPort + "/" + __PATH;
    wsocket = new WebSocket(__URL);
}

function CreateWebSocketWithSpaceInUrl(urlWithSpace) {
    IsWebSocket();
    __URL = "ws://" + urlWithSpace + ":" + __PORT + "/" + __PATH;
    wsocket = new WebSocket(__URL);
}

function CreateWebSocketWithSpaceInProtocol(protocolWithSpace) {
    IsWebSocket();
    __URL = "ws://" + __SERVER__NAME + ":" + __PORT + "/" + __PATH;
    wsocket = new WebSocket(__URL, protocolWithSpace);
}

function CreateWebSocketWithRepeatedProtocols() {
    IsWebSocket();
    __URL = "ws://" + __SERVER__NAME + ":" + __PORT + "/" + __PATH;
    wsocket = new WebSocket(__URL, __REPEATED__PROTOCOLS);
}

function CreateWebSocket(isSecure, isProtocol, isProtocols) {
    IsWebSocket();
    if (isSecure) {
        __URL = "wss://" + __SERVER__NAME + ":" + __SECURE__PORT + "/" + __PATH;
    }
    else {
        __URL = "ws://" + __SERVER__NAME + ":" + __PORT + "/" + __PATH;
    }

    if (isProtocol) {
        wsocket = new WebSocket(__URL, __PROTOCOL);
    }
    else if (isProtocols) {
        wsocket = new WebSocket(__URL, __PROTOCOLS);
    }
    else {
        wsocket = new WebSocket(__URL);
    }
    return wsocket;
}

function BrowserDoesNotSupportWebSocket() {
    document.getElementById("websocketsupport").firstChild.data = "Browser does not Support WebSocket";
}

function OnTimeOutFail() {
    wsocket.close();
    wsocket.onopen = null;
    wsocket.onclose = null;
    wsocket.onerror = null;
    wsocket.onmessage = null;
    wsocket = null;
    assert_true(false, "TimeOut");   
}