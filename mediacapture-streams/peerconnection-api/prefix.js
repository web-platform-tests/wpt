var api = BrowserHasFeature(window, "RTCPeerConnection");
if (!window.RTCPeerConnection && undefined !== api) {
   window.RTCPeerConnection = api;
} 
