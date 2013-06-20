var api = BrowserHasFeature(navigator, "getUserMedia");
if (!window.navigator.getUserMedia && undefined !== api) {
   window.navigator.getUserMedia = api;
} 
